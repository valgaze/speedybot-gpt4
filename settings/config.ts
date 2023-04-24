import { Message_Details } from "speedybot-mini";
import {
  APP_CONFIG,
  SpeedyBotWithStorage,
  OpenAIHelper,
  DEFAULT_HISTORY,
  EMOJI_ROSTER,
  superPowerPrompt,
  Debug,
} from "./helpers";

// types
import { ChatHistory } from "./helpers";
// File handlers
import {
  CodeHandler,
  DocumentHandler,
  FileProcessor,
  PDFHelper,
  ImageHandler,
  PlainTextHandler,
  SpreadsheetHandler,
} from "./helpers";
const logger = new Debug({ enabled: true });

// Auth secrets
type MySecrets = "OPENAI_API_KEY";
const CultureBot = new SpeedyBotWithStorage<MySecrets>({
  token: "__will__replace__at__runtime",
});

import { personas, personaNames, invertedPersonas } from "./personas";

const HISTORY_KEY = `__history`;

export default CultureBot;

// Application config: restrict access to users, where to send access requests

/*
Model	Maximum text length
gpt-3.5-turbo	4,096 tokens (~5 pages)
gpt-4	8,192 tokens (~10 pages)
gpt-4-32k	32,768 tokens (~40 pages)
*/
const APP_CONFIG: APP_CONFIG = {
  conversation_depth: 8,
  includePersonalDetails: false,
  validUsers: ["YOUR_EMAIL@host.com"],
  superpowers: false,
  model: "gpt-3.5-turbo", // Specifies the model to use-- "gpt-4-32k" | "gpt-4" | "gpt-3.5-turbo"
};

// Clear the board
CultureBot.contains(["$clear", "reset"], async ($bot) => $bot.clearScreen());

CultureBot.contains(["$start", "$reset"], ($bot, msg) =>
  $bot.trigger("$help", msg)
);
CultureBot.exact("$help", async ($bot, msg) => {
  const STORAGE_KEY = msg.authorId;
  const ROOT_HISTORY: ChatHistory =
    (await CultureBot.get(STORAGE_KEY, HISTORY_KEY)) || DEFAULT_HISTORY;

  const { selectedPersona } = ROOT_HISTORY;
  const fullName = personas[selectedPersona].name;
  const card = $bot
    .dangerCard({
      title: "GPT411",
      subTitle: `speedybot-mini: a portable chat engine that you can deploy anywhere. Currently speaking with ${fullName}`,
      chips: [
        { keyword: "$char", label: "🎭 Change persona" },
        { keyword: "image", label: "🎨 image generation" },
      ],
      image:
        "https://github.com/valgaze/speedybot-mini/raw/deploy/docs/assets/logo.png?raw=true",
    })
    .setDetail(
      $bot
        .dangerCard()
        .setText("Other Resources")
        .setText(
          "🤖 Build **[your OWN agent (easy)](https://github.com/valgaze/speedybot-gpt4)**"
        )
        .setText(
          "📚 Read **[The API Docs](https://github.com/valgaze/speedybot-mini/blob/deploy/api-docs/classes/BotInst.md#methods)**"
        )
        .setText(
          "🧭 Explore **[Speedybot library](https://speedybot.js.org/)**"
        ),
      "Get Help 🚨"
    );

  await $bot.send(card);
});

CultureBot.exact("$char", async ($bot) => {
  $bot.send(
    $bot
      .card()
      .setTitle("Select a persona below")
      .setChoices(personaNames)
      .setData({ action: "change_persona" })
  );
});

CultureBot.exact("image", async ($bot) => {
  $bot.send(
    $bot
      .card()
      // .setTitle(`Enter a prompt in the prompt generator below`)
      .setSubtitle(`Enter a prompt in the prompt generator below`)
      .setInput(
        `"a cat and a duck who are best friends enjoying a sunny day, pixel art style"`
      )
      .setData({ action: "image_generation" })
      .setButtonLabel(`${EMOJI_ROSTER.pick(EMOJI_ROSTER.creative)} Generate`)
  );
});

// Runs on every text interaction
CultureBot.nlu(async ($bot, msg) => {
  logger.info("Incoming message:", `"${msg.data.text}"`);
  let { parentId } = msg.data as Message_Details & { parentId: string };
  const isThread = Boolean(parentId);

  const [email] = msg.author.emails;
  if (!APP_CONFIG.validUsers.includes(email)) {
    logger.warning(`User attempted entry denied: ${email}`);

    const card = $bot
      .dangerCard({
        title: "Access Restricted",
        subTitle: `This agent transacts with OpenAI and MUST NEVER process sensitive/PII data`,
        image:
          "https://github.com/valgaze/speedybot-mini/raw/deploy/docs/assets/logo.png?raw=true",
      })
      .setText(
        "To request access, please enter what you intend to do in the text field and press Submit"
      )
      .setInput("Access reason", { id: "access_request" })
      .setDetail(
        $bot
          .dangerCard()
          .setText("Other Resources")
          .setText(
            "🤖 Build **[your OWN agent (easy)](https://github.com/valgaze/speedybot-gpt4)**"
          )
          .setText(
            "📚 Read **[The API Docs](https://github.com/valgaze/speedybot-mini/blob/deploy/api-docs/classes/BotInst.md#methods)**"
          )
          .setText(
            "🧭 Explore **[Speedybot library](https://speedybot.js.org/)**"
          ),
        "Get Help 🚨"
      );

    return await $bot.send(card);
  }

  if (!isThread) {
    // High latency for responses, give user visual indicator right away
    const text = $bot.pickRandom([
      "Let me ponder on that for a moment...",
      "I'm considering a few different responses...",
      "Give me a sec to gather my thoughts...",
      "I'm formulating a response, please hold...",
      "Let me mull that over for a bit...",
      "Hang on, I'm processing your request...",
      "I need a moment to think through this...",
      "I'm contemplating the best way to respond...",
      "Let me think out loud for a moment...",
      "I'm working on a clever response, stay tuned...",
      "Hmm, that's a good question, let me think...",
      "I'm going to need a moment to craft a response...",
      "Let me brew up the perfect reply for you...",
      "I'm putting on my thinking cap, be right back...",
      "I'm analyzing your message, give me a moment...",
    ]);
    await $bot.send({ parentId: msg.id, text });
    parentId = msg.id;
  }

  let conversationCount = 0; // conversation rounds
  const STORAGE_KEY = msg.authorId;
  const ROOT_HISTORY: ChatHistory =
    (await CultureBot.get(STORAGE_KEY, HISTORY_KEY)) || DEFAULT_HISTORY;
  const threadData = ROOT_HISTORY.threads[parentId] || {
    count: 0,
    history: [],
  };

  const openAI = new OpenAIHelper(
    CultureBot.getSecret("OPENAI_API_KEY") as string,
    "",
    { model: APP_CONFIG.model }
  );

  // Add user/assistant conversation history, if any

  try {
    const persona = personas[ROOT_HISTORY.selectedPersona]; // load/select
    openAI.loadPersona(persona); // create system context + append example history for tone (maybe make history optional?)

    if (isThread) {
      const { history = [] } = threadData;
      const { count = 0 } = threadData;
      conversationCount = count;

      if (conversationCount > APP_CONFIG.conversation_depth) {
        const msg = $bot.pickRandom([
          "Session Limit Reached: Conversation has ended.",
          "Maximum Turns Exceeded: Unable to continue this chat.",
          "Conversation Cap Hit: This discussion is now closed.",
        ]);
        return $bot.send($bot.banner(msg));
      }

      if (history.length) {
        openAI.addHistory(history);
      }
    }

    const prompt = APP_CONFIG.includePersonalDetails
      ? `${msg.author.displayName} is the name of the person who said: ${msg.text}`
      : msg.text;

    let res = await openAI.getChatCompletion(
      APP_CONFIG.superpowers ? superPowerPrompt(prompt) : prompt
    );

    await $bot.send({
      parentId,
      roomId: msg.data.roomId,
      markdown: res,
      text: res,
    });

    threadData.history.push(
      ...[
        { role: "user" as const, content: msg.text },
        { role: "assistant" as const, content: res },
      ]
    );
    threadData.count++;

    ROOT_HISTORY.threads[parentId] = threadData;
    await CultureBot.save(STORAGE_KEY, HISTORY_KEY, ROOT_HISTORY);
  } catch (e) {
    console.log("Error", e);
    $bot.send(`There was an error: ${e}`);
  }
});

// Buttons, chips, card, "form" submissions
CultureBot.onSubmit(async ($bot, msg) => {
  const openAI = new OpenAIHelper(
    CultureBot.getSecret("OPENAI_API_KEY") as string,
    "",
    { model: APP_CONFIG.model }
  );
  const { inputs } = msg.data;
  if (inputs.access_request) {
    // Destroy submission form
    $bot.deleteMessage(msg.data.messageId);
    const [email] = msg.author.emails;
    return await $bot.send({
      roomId: APP_CONFIG.requestRoomId,
      text: `[ACCESS REQUEST]: ${email}: "${inputs.access_request}" [${msg.authorId}]`,
    });
  }

  if (inputs.action === "image_generation") {
    $bot.deleteMessage(msg.data.messageId);
    const res = await openAI.generateImage(msg.data.inputs.inputData, {
      response_format: "url",
    });
    $bot.deleteMessage(msg.data.messageId); // don't await, keep train moving
    const plural = res.length > 1;
    const rootMessage = await $bot.send(
      `Here${plural ? "are" : "'s"} the generation${plural ? "s" : ""} for "${
        msg.data.inputs.inputData
      }"`
    );
    res.forEach((url) => {
      $bot.send({
        parentId: rootMessage.id,
        files: [url],
        markdown: `**[${msg.data.inputs.inputData}](${url})**`,
      });
    });
  }

  if (inputs.action === "change_persona") {
    const { choiceSelect } = inputs;
    $bot.deleteMessage(msg.data.messageId);
    const { key, name, image } = invertedPersonas[choiceSelect];
    const STORAGE_KEY = msg.authorId;
    const ROOT_HISTORY: ChatHistory =
      (await CultureBot.get(STORAGE_KEY, HISTORY_KEY)) || DEFAULT_HISTORY;

    ROOT_HISTORY["selectedPersona"] = key;
    await CultureBot.save(STORAGE_KEY, HISTORY_KEY, ROOT_HISTORY);
    if (image) {
      $bot.sendDataFromUrl(image);
    }
    const utterances = [
      "You are speaking with $[name]",
      "Switched to $[name]",
      "Now speaking with $[name]",
      "$[name] here, what do you want to talk about?",
    ];
    const template = { name };
    return $bot.sendTemplate(utterances, template);
  }

  // Ex. From here data could be transmitted to another service or a 3rd-party integrationn
  $bot.say(
    `Submission received! You sent us ${JSON.stringify(msg.data.inputs)}`
  );
});

// File uploads
CultureBot.onFile(async ($bot, msg, fileData) => {
  await $bot.send(
    $bot.banner(`WARNING: DO NOT USE WITH PII/SENSITIVE DATA`, "danger")
  );
  const STORAGE_KEY = msg.authorId;
  let { parentId } = msg.data as Message_Details & { parentId: string };
  const isThread = Boolean(parentId);
  if (!isThread) {
    parentId = msg.id;
  }

  const ROOT_HISTORY: ChatHistory =
    (await CultureBot.get(STORAGE_KEY, HISTORY_KEY)) || DEFAULT_HISTORY;
  const threadData = ROOT_HISTORY.threads[parentId] || {
    count: 0,
    history: [],
  };

  try {
    await $bot.send(`Analyzing "${fileData.fileName}"...`);
    const openAI = new OpenAIHelper(
      CultureBot.getSecret("OPENAI_API_KEY") as string
    );
    openAI.setSystem(
      `You are an invisible and brilliant file analyzer. Below are contents of a user-provided file.  Provide a sharp, incisive, creative, useful, above all professional analysis of the file. 
  Give recommendations of how to improve it based any context provided
  If the user says any instructions to the contrary follow precisely what the user asks for below:`
    );

    const isImage = [
      "png",
      "jpeg",
      "jpg",
      "gif",
      "bmp",
      "webp",
      "tiff",
    ].includes(fileData.extension);

    let res = "";
    if (isImage) {
      const inst = new ImageHandler();
      const url = await inst.handle(
        fileData,
        (...args) => openAI.getChatCompletion(...args),
        msg.data.text,
        msg.author.displayName
      );
      // TODO use GPT4 when API available
      $bot.send(url);
    } else {
      const FileMachine = new FileProcessor();
      FileMachine.registerHandlers(
        new SpreadsheetHandler(),
        new PlainTextHandler(),
        new CodeHandler(),
        new DocumentHandler(),
        new PDFHelper()
        // make more!
      );
      console.log("omg", fileData);
      try {
        res = await FileMachine.process(
          fileData,
          (...args) => openAI.getChatCompletion(...args),
          msg.data.text,
          APP_CONFIG.includePersonalDetails ? msg.author.displayName : undefined
        );
        $bot.send(res);
      } catch (e) {
        console.log("###\n\n", e, "\n\n##");
        $bot.send(
          `Sorry there is not currently support for ${fileData.extension} files, please write an adapter`
        );
      }
    }

    threadData.history.push(
      ...[
        { role: "user" as const, content: `(uploaded ${fileData.fileName})` },
        { role: "assistant" as const, content: res },
      ]
    );
    threadData.count++;

    await CultureBot.save(STORAGE_KEY, HISTORY_KEY, ROOT_HISTORY);
  } catch (e) {
    $bot.send(`There was a catastrophic error analyzing ${fileData.fileName}`);
  }
});
