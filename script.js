// 1. API CONFIGURATION
const OPENAI_API_KEY = "YOUR_OWN_OPENAI_API_KEY";
const API_URL = "https://api.openai.com/v1/chat/completions";


// 2. DOM ELEMENTS
const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");

// 3. CHAT HISTORY TRACKING
// System message establishes context. User and AI interactions will stack here.
let conversationHistory = [
    { role: "system", content: "You are a helpful and clear AI assistant." }
];

// Initialize and restore previous text history on window load
document.addEventListener("DOMContentLoaded", () => {
    loadChatHistory();
});

// 4. UI RENDER HELPER
// Injects elements dynamically into the interface container and snaps window scroll
function appendMessage(text, className) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);
    messageDiv.innerText = text;
    chatBox.appendChild(messageDiv);
    
    // Auto-scroll mechanics so newest dialogue blocks remain visible
    chatBox.scrollTop = chatBox.scrollHeight;
    return messageDiv; // Reference handle to clear loading text/states later
}

// 5. CHAT ENGINE AND CORE API ROUTINE
async function handleSendMessage() {
    // Trim eliminates blank padding space text entries
    const messageText = userInput.value.trim();

    // REQUIREMENT CHECK: VALIDATE EMPTY INPUT & FORCE INPUT
    // Instantly halts operation before the script attempts to ping the OpenAI servers
    if (messageText === "") {
        alert("Empty messages are not allowed. Please type a valid message!");
        return;
    }

    // Render user message to UI immediately and empty the input row
    appendMessage(messageText, "user-message");
    userInput.value = "";

    // REQUIREMENT CHECK: KEEP CHAT HISTORY (Save User Text)
    conversationHistory.push({ role: "user", content: messageText });
    saveChatHistoryToStorage();

    // REQUIREMENT CHECK: DISPLAY LOADING MESSAGE
    // Creates a visual cue stating the AI engine is thinking/processing
    const loadingMessageElement = appendMessage("AI is thinking...", "loading-message");

    // REQUIREMENT CHECK: SEND MESSAGE TO OPENAI API
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Cost-effective, robust default model configuration
                //model: "gpt-3.5-turbo",
                messages: conversationHistory // Passing full arrays preserves contextual chat memory threads
            })
        });

        // REQUIREMENT CHECK: HANDLE API NETWORK ERRORS (HTTP Codes)
        if (!response.ok) {
            throw new Error(`Server returned status code ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // REQUIREMENT CHECK: OUTPUT REAL AI RESPONSE
        const aiResponseText = data.choices[0].message.content;

        // Clear out the loading visual indicator and post clean text data
        loadingMessageElement.remove();
        //if (loadingMessageElement) loadingMessageElement.remove();
        appendMessage(aiResponseText, "ai-message");

        // REQUIREMENT CHECK: KEEP CHAT HISTORY (Save AI Text)
        conversationHistory.push({ role: "assistant", content: aiResponseText });
        saveChatHistoryToStorage();

        } catch (error) {
        // ERROR HANDLING: Catch network disconnections or code exceptions safely
        //console.error("Chatbot Error:", error);
        console.error("FULL ERROR OBJECT:", error);
        appendMessage(error.message, "error-message");
        
        // Remove structural loading states cleanly
        loadingMessageElement.remove(); 
        //if (loadingMessageElement) loadingMessageElement.remove();
        appendMessage("Sorry, something went wrong. Please try again.", "error-message");
    }
};


// 6. REQUIREMENT CHECK: CLEAR CHAT BUTTON LOGIC
clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your entire chat history?")) {
        // Revert interface view to default baseline state
        chatBox.innerHTML = '<div class="message ai-message">Hello! I am your AI assistant. How can I help you today?</div>';
        
        // Wipe local variables and browser local storage instances entirely
        conversationHistory = [{ role: "system", content: "You are a helpful and clear AI assistant." }];
        localStorage.removeItem("localChatHistory");
    }
});

// 7. USER EVENT TRIGGERS
sendBtn.addEventListener("click", handleSendMessage);

// Listen to mechanical keyboard inputs so hitting 'Enter' submits queries seamlessly
userInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        handleSendMessage();
    }
});

// 8. STORAGE MECHANICS FOR CONTINUOUS PERSISTENCE
function saveChatHistoryToStorage() {
    localStorage.setItem("localChatHistory", JSON.stringify(conversationHistory));
}

function loadChatHistory() {
    const savedHistory = localStorage.getItem("localChatHistory");
    if (savedHistory) {
        conversationHistory = JSON.parse(savedHistory);
        chatBox.innerHTML = ""; // Empty baseline elements before re-rendering
        
        // Rebuild dialogue windows back into visibility safely step-by-step
        conversationHistory.forEach(msg => {
            if (msg.role === "user") {
                appendMessage(msg.content, "user-message");
            } else if (msg.role === "assistant") {
                appendMessage(msg.content, "ai-message");
            }
        });
    }
}
