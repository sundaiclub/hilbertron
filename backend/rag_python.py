from ai21 import AI21Client
from openai import OpenAI
openai_client = OpenAI(api_key='')

ai12_client = AI21Client(api_key="")

def gpt_call(step:list[str], assumption: list[str], maestro_output):
    completion = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Given the steps: {step}, the assumptions: {assumption}, "
                    f"and the output: {maestro_output}, determine whether the output is correct. "
                    "Respond ONLY with a single digit: 1 if correct, 0 if incorrect. "
                    "Do not include any explanation or extra text."
                )
            }
        ]
    )
    print('this is output',completion.choices[0].message.content.strip())
    return completion.choices[0].message.content.strip()


def maestro_rag(step: list[str], assumptions: list[str]):
    run = ai12_client.beta.maestro.runs.create_and_poll(
        input=f"Prove this: {step} using this assumptions: {assumptions}",
        tools=[{"type": "file_search"}],
        # tool_resources={"file_search": {"file_ids": [file]}}

    )
    check = gpt_call(step=step, assumption=assumptions, maestro_output=run.result)

    # Make sure check is actually an integer
    try:
        if int(check) == 1:
            # The output was correct — handle accordingly
            return "success"
        else:
            return "failure"
    except ValueError:
        print(f"Unexpected model output: {check}")
        return "error"

    # return run.result

# diff = ['An object is moving along a straight line with acceleration given by a(t) = sin(t), where t is time in seconds. The initial velocity is v(0) = v0 and the initial position is p(0) = p0, where v0 and p0 are real-valued constants.']
# assumpt=['An object is moving along a straight line with acceleration given by a(t) = sin(t), where t is time in seconds. The initial velocity is v(0) = v0 and the initial position is p(0) = p0, where v0 and p0 are real-valued constants.']
# file_id = 'fa434b8e-bd5e-4104-9b7c-85ceaf5b9127'
input = maestro_rag(diff,assumpt)
print(input)

