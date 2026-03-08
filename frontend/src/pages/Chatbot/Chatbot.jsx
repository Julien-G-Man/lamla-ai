import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import MathRenderer from '../../components/MathRenderer';
import './Chatbot.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSpinner, 
    faTimesCircle, 
    faFolder, 
    faGlobe, 
    faPaperPlane,
    faCopy
} from '@fortawesome/free-solid-svg-icons';
import djangoApi from '../../services/api'; 

// Global counter for generating unique message IDs
let messageIdCounter = Date.now();

const formatFileSize = (size) => {
    if (!size || Number.isNaN(size)) return "";
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const Chatbot = ({ user }) => {
    // --- State Variables ---
    const [messageInput, setMessageInput] = useState('');
    const [attachedFile, setAttachedFile] = useState(null); 
    const [isSearchPopupVisible, setIsSearchPopupVisible] = useState(false);
    const [currentSearchMode, setCurrentSearchMode] = useState('disabled');
    const [isProcessing, setIsProcessing] = useState(false); 
    const [history, setHistory] = useState([
        { id: messageIdCounter++, text: "👋 Hello! I'm your AI study assistant. Ask me anything about your study materials or exams. Let’s study smarter together!", type: 'ai', sender: 'AI Tutor' }
    ]);
    
    // --- Ref Variables ---
    const chatMessagesRef = useRef(null);
    const textareaRef = useRef(null);

    // --- Utility Functions ---

    const scrollToBottom = () => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    };

    const clearAttachment = () => {
        setAttachedFile(null);
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
    };

    // --- Core Logic (API Calls) ---

    const addMessage = (text, type, sender = null, extra = {}) => {
        const newMessage = { id: messageIdCounter++, text, type, sender, ...extra };
        setHistory(prev => [...prev, newMessage]);
        return newMessage; // Return the message object to capture its specific ID
    };
    
    const handleSendMessage = useCallback(async (e) => {
        if (e) e.preventDefault(); 

        let text = messageInput.trim();
        const fileToSend = attachedFile;

        const isTextPresent = text.length > 0;
        const isReadyToSend = isTextPresent || fileToSend;
        
        if (!isReadyToSend || isProcessing) return;

        if (!isTextPresent && fileToSend) {
            text = `Analyze the uploaded document and summarize its key concepts.`;
        }

        // 1. Prepare UI for sending
        addMessage(text, "user", null, fileToSend ? {
            attachment: {
                name: fileToSend.name,
                size: fileToSend.size,
            }
        } : {});
        
        setMessageInput(''); 
        clearAttachment();
        
        // 2. Set up AI response container and lock UI
        // FIXED: Capture the ID from the returned message object to ensure we update the correct bubble
        const aiPlaceholder = addMessage("", "ai", "AI Tutor", { isThinking: true }); 
        const placeholderId = aiPlaceholder.id;
        
        setIsProcessing(true); 

        try {
            if (fileToSend) {
                // A. File Upload (Non-streaming endpoint)
                const fileApiEndpoint = "chat/file/";

                const formData = new FormData();
                formData.append('file_upload', fileToSend);
                formData.append('message', text);
                formData.append('search_mode', currentSearchMode);
                
                const res = await djangoApi.post(fileApiEndpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const aiResponseText = res.data?.response || "[Error: Empty response from file API]";

                setHistory(prev => prev.map(msg => 
                    msg.id === placeholderId ? { ...msg, text: aiResponseText, isThinking: false } : msg
                ));

            } else {
                // B. Standard Streamed Chat (Streaming endpoint)
                const streamApiEndpoint = "/chat/stream/";
                const baseUrl = djangoApi.defaults.baseURL.replace(/\/+$/, "");
                const fullStreamUrl = `${baseUrl}${streamApiEndpoint}`;
                const token = localStorage.getItem("auth_token");

                const res = await fetch(fullStreamUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Token ${token}` } : {}),
                    },
                    credentials: "include",
                    body: JSON.stringify({ 
                        message: text,
                        search_mode: currentSearchMode,
                        conversation_history: [], 
                        context_document: null 
                    }),
                });

                if (!res.ok || !res.body) {
                    throw new Error(`This service is unavailable for now, but we are working on it. Please come back later.
                        Stream API Connection Error: ${res.status}`);
                }
                
                const reader = res.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let accumulatedText = "";
                let frameId = null;
                let pendingText = "";

                const flushState = (force = false) => {
                    if (!force && frameId !== null) return;
                    const run = () => {
                        frameId = null;
                        if (!pendingText) return;
                        const nextText = pendingText;
                        pendingText = "";
                        setHistory(prev => prev.map(msg =>
                            msg.id === placeholderId ? { ...msg, text: nextText, isThinking: false } : msg
                        ));
                        scrollToBottom();
                    };
                    if (force) {
                        run();
                    } else {
                        frameId = window.requestAnimationFrame(run);
                    }
                };

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    accumulatedText += chunk;
                    pendingText = accumulatedText;
                    flushState(false);
                }
                flushState(true);
            }
        } catch (err) {
            console.error("API Error:", err);
            const errorMsg = err.response?.data?.detail || err.message || "An unknown error occurred.";
            
            setHistory(prev => prev.map(msg => 
                msg.id === placeholderId ? { ...msg, text: `[Error: ${errorMsg}]`, isThinking: false } : msg
            ));
        } finally {
            setIsProcessing(false);
            scrollToBottom();
        }
    }, [messageInput, attachedFile, currentSearchMode, isProcessing]);

    // --- Effect Hooks ---

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; 
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; 
        }
    }, [messageInput]);

    useEffect(() => {
        scrollToBottom();
    }, [history]);


    // --- Handler Functions ---

    const handleInputChange = (e) => setMessageInput(e.target.value);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { 
                alert(`[Error: File ${file.name} is too large. Max size is 10MB.]`);
                e.target.value = ''; 
                return;
            }
            setAttachedFile(file);
        } else {
            clearAttachment();
        }
    };

    const handleSearchModeChange = (e) => {
        setCurrentSearchMode(e.target.value);
        setIsSearchPopupVisible(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Optional: You could add a temporary "Copied!" toast here
            alert("Response copied to clipboard!");
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };


    // --- Render Logic ---
    const isSearchActive = currentSearchMode !== 'disabled';
    const fileBarClassName = `file-status-bar ${attachedFile ? '' : 'hidden'}`;
    const searchIndicatorClassName = `search-indicator ${isProcessing && isSearchActive ? '' : 'hidden'}`;
    const fileNameDisplay = attachedFile ? attachedFile.name : '';
    const fileSizeDisplay = attachedFile ? formatFileSize(attachedFile.size) : "";
    const sendButtonClass = isProcessing ? 'processing' : '';
    const searchButtonClass = `file-upload-btn ${isSearchActive ? 'active-search' : ''}`;
    
    const isTextPresent = messageInput.trim().length > 0;
    const isReadyToSend = isTextPresent || attachedFile;
    const shouldBeDisabled = !isReadyToSend || isProcessing; 

    const MessageBubble = ({ message }) => (
        <div className={`message-bubble ${message.type}-message`}>
            {message.sender && (
                <div className="sender-row">
                    <div className="sender-name">{message.sender}</div>
                    {message.type === 'ai' && !message.isThinking && (
                        <button 
                            className="copy-btn" 
                            title="Copy to clipboard"
                            onClick={() => copyToClipboard(message.text)}
                        >
                            <FontAwesomeIcon icon={faCopy} size="xs" />
                        </button>
                    )}
                </div>
            )}
            {message.attachment && (
                <div className="message-attachment-chip">
                    <span className="attachment-chip-icon" aria-hidden="true">
                        <FontAwesomeIcon icon={faFolder} />
                    </span>
                    <span className="attachment-chip-name">{message.attachment.name}</span>
                    <span className="attachment-chip-size">{formatFileSize(message.attachment.size)}</span>
                </div>
            )}
            {message.isThinking ? (
                <div className="ai-thinking-dots" aria-label="AI is typing">
                    <span></span><span></span><span></span>
                </div>
            ) : (
                <p style={{ whiteSpace: 'pre-wrap' }}><MathRenderer text={message.text} /></p>
            )}
        </div>
    );
    
    return (
        <>
            <Navbar user={user}/>
            <div className="chat-container">
                <div className="chat-header">
                    <h1>AI Tutor</h1>
                    <span className="user-id-display" id="user-id-display">Connected</span>
                </div>

                <div id="chat-messages" ref={chatMessagesRef}>
                    {history.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                </div>

                

                <div id="search-indicator" className={searchIndicatorClassName}>
                    <span className="searching-text">
                        <FontAwesomeIcon icon={faSpinner} spin /> 
                        {currentSearchMode === 'deep_research' ? 'Conducting deep research...' : 'Searching the web...'}
                    </span>
                </div>

                <div id="file-status-bar" className={fileBarClassName}>
                    <div className="file-meta-wrap">
                        <span className="file-meta-icon" aria-hidden="true">
                            <FontAwesomeIcon icon={faFolder} />
                        </span>
                        <div className="file-meta-text">
                            <span id="file-name-display" className="truncate">{fileNameDisplay}</span>
                            <span className="file-size-display">{fileSizeDisplay}</span>
                        </div>
                        <span className="file-ready-badge">Ready</span>
                    </div>
                    <button id="clear-file-btn" title="Remove attachment" onClick={clearAttachment} disabled={isProcessing}>
                        <FontAwesomeIcon icon={faTimesCircle} />
                    </button>
                </div>

                <div id="web-search-options-popup" className={`web-search-popup ${isSearchPopupVisible ? '' : 'hidden'}`}>
                    <p className="popup-title">Web Search Mode:</p>
                    {['disabled', 'web_search', 'deep_research'].map((mode) => (
                        <label key={mode}>
                            <input 
                                type="radio" 
                                name="search-mode" 
                                value={mode} 
                                checked={currentSearchMode === mode}
                                onChange={handleSearchModeChange}
                            />
                            {mode === 'disabled' && 'Disabled (Use internal knowledge)'}
                            {(mode === 'web_search' || mode === 'deep_research') && <strong>{mode === 'web_search' ? 'Web Search' : 'Deep Research'}</strong>}
                            {mode === 'web_search' && ' (Quick, real-time results)'}
                            {mode === 'deep_research' && ' (In-depth, multi-step analysis)'}
                        </label>
                    ))}
                </div>

                <div className="chat-input-area">
                    <button 
                        className={searchButtonClass} 
                        title="Web Search Options"
                        onClick={() => setIsSearchPopupVisible(prev => !prev)}
                        disabled={isProcessing}
                    >
                        <FontAwesomeIcon icon={faGlobe} />
                    </button>
                    
                    <label htmlFor="file-input" className="file-upload-btn" title="Upload File">
                        <FontAwesomeIcon icon={faFolder} />
                        <input 
                            type="file" 
                            id="file-input" 
                            accept=".pdf, .docx, .pptx, .txt"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                        />
                    </label>
                    
                    <textarea 
                        ref={textareaRef} 
                        id="message-input" 
                        placeholder="Ask me anything..." 
                        rows="1"
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault(); 
                                handleSendMessage(e);
                            }
                        }}
                        disabled={isProcessing}
                    ></textarea>
                    
                    <button 
                        id="send-btn" 
                        title="Send Message" 
                        className={sendButtonClass}
                        disabled={shouldBeDisabled}
                        onClick={handleSendMessage}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                </div>
            </div>
        </>
    );
};

export default Chatbot;
