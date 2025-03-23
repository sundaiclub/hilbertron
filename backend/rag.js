const OpenAI = require('openai');
const { AI21 } = require('ai21');

const openaiClient = new OpenAI({
    apiKey: ''
});

const ai21Client = new AI21({
    apiKey: test
});

async function gptCall(theorem, assumption, maestroOutput) {
    try {
        const completion = await openaiClient.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "user",
                content: `Given the theorem: ${theorem}, the assumption: ${assumption}, ` +
                    `and the output: ${maestroOutput}, determine whether the output is correct. ` +
                    "Respond ONLY with a single digit: 1 if correct, 0 if incorrect. " +
                    "Do not include any explanation or extra text."
            }]
        });
        
        console.log('this is output', completion.choices[0].message.content.trim());
        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error in gptCall:', error);
        throw error;
    }
}

async function maestroRag(theorem, assumption, file) {
    try {
        const run = await ai21Client.beta.maestro.runs.createAndPoll({
            input: `Prove this: ${theorem} using this assumption: ${assumption}`,
            tools: [{ type: "file_search" }],
            toolResources: { fileSearch: { fileIds: [file] } }
        });

        const check = await gptCall(theorem, assumption, run.result);

        try {
            if (parseInt(check) === 1) {
                return "success";
            } else {
                return "failure";
            }
        } catch (error) {
            console.log(`Unexpected model output: ${check}`);
            return "error";
        }
    } catch (error) {
        console.error('Error in maestroRag:', error);
        throw error;
    }
}

// Example usage
// const diff = 'An object is moving along a straight line with acceleration given by a(t) = sin(t), where t is time in seconds. The initial velocity is v(0) = v0 and the initial position is p(0) = p0, where v0 and p0 are real-valued constants.';
// const assumpt = 'An object is moving along a straight line with acceleration given by a(t) = sin(t), where t is time in seconds. The initial velocity is v(0) = v0 and the initial position is p(0) = p0, where v0 and p0 are real-valued constants.';
// const fileId = 'fa434b8e-bd5e-4104-9b7c-85ceaf5b9127';

// Run the main function
(async () => {
    try {
        const input = await maestroRag(diff, assumpt, fileId);
        console.log(input);
    } catch (error) {
        console.error('Error:', error);
    }
})();
