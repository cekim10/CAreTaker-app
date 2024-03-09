from flask import Flask, request, jsonify
import openai
from langchain.prompts import FewShotPromptTemplate, PromptTemplate
from twilio.rest import Client

account_sid = 'AC71abd9bdd8dff6c3e2e021dd9354eae1'
auth_token = 'b70d14389b80a49ee78cfd908f37baad'
client = Client(account_sid, auth_token)


app = Flask(__name__)

apikey = "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"
openai.api_key = apikey
chatStr = ""


def support(query):
    examples = [
        {"query": "Hi Jarvis, it's been a confusing day.?", "answer": "I'm here for you. What's been on your mind?"},
        {"query": "I can't remember where I put my glasses. ", "answer": "It's okay, these things happen. Let's try to retrace your steps together. Can you remember the last place you saw them?"},
        {"query": "I feel lost and can't recall names.?", "answer": "I understand that can be frustrating. Let's take a moment to focus on the positive memories associated with those individuals. Can you tell me a bit about your favorite memories with them?"},
        {"query": "I'm feeling lonely.", "answer": "I'm here with you. Let's chat about things that bring happiness. Is there a particular topic or memory that you find comforting?"},
        {"query": "I keep forgetting appointments.", "answer": "It's okay; memory lapses happen. Maybe we can set up reminders together or find a way to make it easier for you to remember. What do you think would help?"},
        {"query": "I miss the old times.", "answer": "I understand. Let's reminisce about some wonderful memories. Is there a specific moment or event that you'd like to talk about?"},
        {"query": "I don't know what to do with myself.", "answer": "I'm here to help. Let's explore some activities or hobbies that you used to enjoy. Maybe we can find something that brings you a sense of fulfillment."},
        {"query": "Thank you for being patient with me", "answer": "Of course, I'm here to support you. If there's anything specific you'd like to talk about or if you need assistance, feel free to let me know."}
    ]

    example_template = """
    User: {query}
    AI: {answer}
    """

    example_prompt = PromptTemplate(
        input_variables=["query", "answer"],
        template=example_template
    )

    prefix = """The following are excerpts from conversations with an AI assistant. You are a helpful assistant providing support to someone with dementia. Engage in a positive and comforting conversation, assist with memory recall, and offer emotional support."""
    suffix = """User: {query}\nAI:"""

    few_shot_prompt_template = FewShotPromptTemplate(
        examples=examples,
        example_prompt=example_prompt,
        prefix=prefix,
        suffix=suffix,
        input_variables=["query"],
        example_separator="\n"
    )

    response = openai.Completion.create(
        model="gpt-3.5-turbo-instruct",
        prompt=few_shot_prompt_template.format(query=query),
        temperature=0.7,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    return response["choices"][0]["text"]

def chat(query):
    global chatStr
    openai.api_key = apikey
    chatStr += f"{query}\n Jarvis: "
    response = openai.Completion.create(
        model="gpt-3.5-turbo-instruct",
        prompt=chatStr,
        temperature=0.7,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    chatStr += f"{response['choices'][0]['text']}\n"
    return response["choices"][0]["text"]

def parse_reminder_command(text):
    if "set an alarm" in text.lower() and "for" in text.lower():
        time_index = text.lower().index("for") + len("for")
        time = text[time_index:].strip()
        note_index = text.lower().index("to") + len("to")
        note = text[note_index:].strip()
        print (note)
        return time, note
    else:
        return None, None

@app.route("/data", methods=["POST"])
def handle_data():
    data = request.get_json()
    text = data.get("text")

    print(f"Received text: {text}")

    if text.lower() == "jarvis help":
        response = support(text)

    elif text.lower().startswith("set an alarm"):
        print("in reminder")
        time, note = parse_reminder_command(text)
        if time and note:
            response = f"Setting an alarm for {time} to {note}"
        else:
            response = "Sorry, I couldn't understand the reminder command."
            
    elif text.lower() == "open youtube":
        response = "open_youtube"
        
    elif text.lower() == "open calendar":
        response = "open_calendar"
        
    elif text.lower() == "open photos":
        response = "open_photos"
        
    elif text.lower() == "open settings":
        response = "open_settings"
        
    elif text.lower() == "open map":
        response = "open_maps"
 
    elif text.lower() == "send message":
        response = "open_sms"

    elif text.lower() == "open reminder":
        response = "open_reminders"

    elif text.lower() == "jarvis emergency":
        message = client.messages.create(
        from_='+18666791390',
        body='There is an emergency!',
        to='+18315296251'
        )
        print(message.sid)
    else:
        response = chat(text)

    return jsonify({"data_received": text, "gpt_response": response})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001)
