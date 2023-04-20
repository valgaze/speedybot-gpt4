// Experimental way to force all responses to parse'able JSON
// Enhancement: return plain string if type is not of history/

export const superPowerPrompt = (user_query: string) => `
${user_query}
Please return a JSON response in one of the following formats.
Please return links, tables, etc in markdown format in the content section.
Never comment on the fact you're using markdown

1. If it is just text response, retunr the plain string
2. { "action": "generate_image", "content": "hey make an image of a cat & a duck who best friends having fun on a sunny day" }
Ex. if the user tells you something like "hey make an image of a cat & a duck who best friends having fun on a sunny day"
3. { "action": "super_power", "content": "history" }
Ex. if user says "what's my current chat history?"
`;
