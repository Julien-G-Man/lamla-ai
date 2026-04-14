import React, { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from './Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import './Chatbot.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faTimesCircle,
    faFolder,
    faGlobe,
    faPaperPlane,
    faCopy,
    faAngleDoubleLeft,
    faArrowDown
} from '@fortawesome/free-solid-svg-icons';
import djangoApi from '../../services/api'; 
import { useAuth } from '../../context/AuthContext';
import { normalizeScientificText } from '../../utils/scientificText';

// Global counter for generating unique message IDs
let messageIdCounter = Date.now();

const formatFileSize = (size) => {
    if (!size || Number.isNaN(size)) return "";
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const getWelcomeMessage = () => ({
    id: messageIdCounter++,
    text: "👋 Hello! I'm AI Tutor, your AI study assistant. Ask me anything about your study materials or exams. Let’s study smarter together!",
    type: 'ai',
    sender: 'AI Tutor',
});

const toUiMessage = (msg) => ({
    id: msg.id || messageIdCounter++,
    text: msg.content || '',
    type: msg.sender === 'user' ? 'user' : 'ai',
    sender: msg.sender === 'ai' ? 'AI Tutor' : null,
});

const Chatbot = ({ user: userProp }) => {
    const { user: authUser } = useAuth();
    const user = userProp ?? authUser;
    const isAuthenticated = Boolean(user || localStorage.getItem('auth_token'));
    // --- State Variables ---
    const [messageInput, setMessageInput] = useState('');
    const [attachedFile, setAttachedFile] = useState(null); 
    const [isSearchPopupVisible, setIsSearchPopupVisible] = useState(false);
    const [currentSearchMode, setCurrentSearchMode] = useState('disabled');
    const [isProcessing, setIsProcessing] = useState(false); 
    const [history, setHistory] = useState([getWelcomeMessage()]);
    

    // Session Management State
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [chatSessions, setChatSessions] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth > 768);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    
    // --- Ref Variables ---
    const chatMessagesRef = useRef(null);
    const textareaRef = useRef(null);
    const scrollToBottomButtonRef = useRef(null);
    const showScrollToBottomRef = useRef(false);
    const visibilityRafRef = useRef(null);

    // --- Utility Functions ---

    const scrollToBottom = () => {
        const container = chatMessagesRef.current;
        if (container && container.scrollHeight > container.clientHeight + 8) {
            container.scrollTop = container.scrollHeight;
        } else {
            const scroller = document.scrollingElement || document.documentElement;
            window.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
        }
        showScrollToBottomRef.current = false;
        setShowScrollToBottom(false);
    };

    const updateScrollToBottomVisibility = useCallback(() => {
        const container = chatMessagesRef.current;
        const hasContainerScroll = Boolean(container && container.scrollHeight > container.clientHeight + 8);

        let distanceFromBottom = 0;
        if (hasContainerScroll && container) {
            distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        } else {
            const scroller = document.scrollingElement || document.documentElement;
            distanceFromBottom = scroller.scrollHeight - scroller.scrollTop - window.innerHeight;
        }

        const shouldShow = showScrollToBottomRef.current
            ? distanceFromBottom > 12
            : distanceFromBottom > 48;

        if (shouldShow !== showScrollToBottomRef.current) {
            showScrollToBottomRef.current = shouldShow;
            setShowScrollToBottom(shouldShow);
        }
    }, []);

    const scheduleScrollToBottomVisibilityUpdate = useCallback(() => {
        if (visibilityRafRef.current !== null) {
            return;
        }

        visibilityRafRef.current = window.requestAnimationFrame(() => {
            visibilityRafRef.current = null;
            updateScrollToBottomVisibility();
        });
    }, [updateScrollToBottomVisibility]);

    const clearAttachment = () => {
        setAttachedFile(null);
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
    };


    // Session Management Functions
    const fetchChatHistory = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        try {
            setIsLoadingHistory(true);
            const response = await djangoApi.get('/chatbot/history/');
            if (response.data && response.data.history) {
                setChatSessions(response.data.history);
                // Auto-load first session if history exists
                if (response.data.history.length > 0) {
                    const firstSession = response.data.history[0];
                    const firstSessionId = firstSession.session_id || firstSession.id;
                    setCurrentSessionId(firstSessionId);
                    await loadSessionMessages(firstSessionId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    const loadSessionMessages = async (sessionId) => {
        try {
            setHistory([{ id: messageIdCounter++, text: "Loading past messages...", type: 'ai', sender: 'AI Tutor' }]);
            const response = await djangoApi.get('/chat/history/', {
                params: { session_id: sessionId },
            });

            const messages = Array.isArray(response?.data?.messages) ? response.data.messages : [];
            if (messages.length === 0) {
                setHistory([getWelcomeMessage()]);
                return;
            }

            setHistory(messages.map(toUiMessage));
        } catch (error) {
            console.error('Failed to load session:', error);
            setHistory([{ id: messageIdCounter++, text: '[Error: Failed to load conversation.]', type: 'ai', sender: 'AI Tutor' }]);
        }
    };

    const handleNewChat = () => {
        // Generate a new UUID for the new session
        const newSessionId = 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        setCurrentSessionId(newSessionId);
        setHistory([getWelcomeMessage()]);
        setMessageInput('');
        clearAttachment();
    };

    const handleSwitchSession = async (sessionId) => {
        setCurrentSessionId(sessionId);
        await loadSessionMessages(sessionId);
    };

    const handleDeleteSession = async (sessionId) => {
        try {
            await djangoApi.delete('/chat/history/', {
                params: { session_id: sessionId },
            });

            setChatSessions((prev) => {
                const remaining = prev.filter((session) => (session.session_id || session.id) !== sessionId);

                if (currentSessionId === sessionId) {
                    if (remaining.length > 0) {
                        const nextSessionId = remaining[0].session_id || remaining[0].id;
                        setCurrentSessionId(nextSessionId);
                        loadSessionMessages(nextSessionId);
                    } else {
                        setCurrentSessionId(null);
                        setHistory([getWelcomeMessage()]);
                    }
                }

                return remaining;
            });
        } catch (error) {
            console.error('Failed to delete session:', error);
            alert('Could not delete the chat session. Please try again.');
        }
    };

    const handleRenameSession = async (sessionId, title) => {
        try {
            const response = await djangoApi.post('/chat/history/rename/', {
                session_id: sessionId,
                title,
            });

            const updatedTitle = response?.data?.title || title;
            setChatSessions((prev) =>
                prev.map((session) =>
                    (session.session_id || session.id) === sessionId
                        ? { ...session, title: updatedTitle }
                        : session
                )
            );
        } catch (error) {
            console.error('Failed to rename session:', error);
            alert('Could not rename the chat session. Please try again.');
        }
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
                formData.append('session_id', currentSessionId);
                
                const res = await djangoApi.post(fileApiEndpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const aiResponseText = res.data?.response || "[Error: Empty response from file API]";
                const returnedSessionId = res.data?.session_id;

                // Update session_id if it was newly created
                if (returnedSessionId && returnedSessionId !== currentSessionId) {
                    setCurrentSessionId(returnedSessionId);
                }

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
                        session_id: currentSessionId,
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
    }, [messageInput, attachedFile, currentSearchMode, isProcessing, currentSessionId]);

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

    useEffect(() => {
        scheduleScrollToBottomVisibilityUpdate();
    }, [history, scheduleScrollToBottomVisibilityUpdate]);

    useEffect(() => {
        showScrollToBottomRef.current = showScrollToBottom;

        if (!showScrollToBottom && scrollToBottomButtonRef.current === document.activeElement) {
            scrollToBottomButtonRef.current.blur();
        }
    }, [showScrollToBottom]);

    useEffect(() => {
        const handleResize = () => scheduleScrollToBottomVisibilityUpdate();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [scheduleScrollToBottomVisibilityUpdate]);

    useEffect(() => {
        const handleWindowScroll = () => scheduleScrollToBottomVisibilityUpdate();
        window.addEventListener('scroll', handleWindowScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleWindowScroll);
    }, [scheduleScrollToBottomVisibilityUpdate]);

    useEffect(() => {
        return () => {
            if (visibilityRafRef.current !== null) {
                window.cancelAnimationFrame(visibilityRafRef.current);
            }
        };
    }, []);

    // Fetch chat history on mount
    useEffect(() => {
        fetchChatHistory();
    }, [fetchChatHistory]);


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
    const scrollToBottomButtonStyle = {
        opacity: showScrollToBottom ? 1 : 0,
        transform: showScrollToBottom ? 'translateY(0)' : 'translateY(8px)',
        pointerEvents: showScrollToBottom ? 'auto' : 'none',
    };

    const MessageBubble = ({ message }) => (
        <div className={`message-bubble ${message.type}-message`}>
            {(() => {
                const displayText = message.type === 'ai'
                    ? normalizeScientificText(message.text)
                    : message.text;

                return (
                    <>
            {message.sender && (
                <div className="sender-row">
                    <div className="sender-name">{message.sender}</div>
                    {message.type === 'ai' && !message.isThinking && (
                        <button 
                            className="copy-btn" 
                            title="Copy to clipboard"
                            onClick={() => copyToClipboard(displayText)}
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
                <div className="message-content">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={{
                            p: ({node, ...props}) => <p className="md-p" {...props} />,
                            strong: ({node, ...props}) => <strong className="md-strong" {...props} />,
                            em: ({node, ...props}) => <em className="md-em" {...props} />,
                            ul: ({node, ...props}) => <ul className="md-ul" {...props} />,
                            ol: ({node, ...props}) => <ol className="md-ol" {...props} />,
                            li: ({node, ...props}) => <li className="md-li" {...props} />,
                            h1: ({node, children, ...props}) => <h1 className="md-h1" {...props}>{children}</h1>,
                            h2: ({node, children, ...props}) => <h2 className="md-h2" {...props}>{children}</h2>,
                            h3: ({node, children, ...props}) => <h3 className="md-h3" {...props}>{children}</h3>,
                            h4: ({node, children, ...props}) => <h4 className="md-h4" {...props}>{children}</h4>,
                            blockquote: ({node, ...props}) => <blockquote className="md-blockquote" {...props} />,
                            code: ({node, inline, ...props}) =>
                                inline
                                    ? <code className="md-code-inline" {...props} />
                                    : <code className="md-code-block" {...props} />,
                            pre: ({node, ...props}) => <pre className="md-pre" {...props} />,
                            a: ({node, children, ...props}) => <a className="md-a" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                            hr: ({node, ...props}) => <hr className="md-hr" {...props} />,
                            table: ({node, ...props}) => (
                                <div className="chatbot-table-scroll">
                                    <table className="chatbot-table" {...props} />
                                </div>
                            ),
                            thead: ({node, ...props}) => <thead className="chatbot-thead" {...props} />,
                            tbody: ({node, ...props}) => <tbody className="chatbot-tbody" {...props} />,
                            th: ({node, ...props}) => <th className="chatbot-th" {...props} />,
                            td: ({node, ...props}) => <td className="chatbot-td" {...props} />,
                        }}
                    >
                        {displayText}
                    </ReactMarkdown>
                </div>
            )}
                    </>
                );
            })()}
        </div>
    );
    
    return (
        <>
            <Navbar user={user}/>
            <div className="chat-wrapper">
                <Sidebar
                    sessions={chatSessions}
                    currentSessionId={currentSessionId}
                    onNewChat={handleNewChat}
                    onSwitchSession={handleSwitchSession}
                    onDeleteSession={handleDeleteSession}
                    onRenameSession={handleRenameSession}
                    isOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isLoading={isLoadingHistory}
                    user={user}
                    isAuthenticated={isAuthenticated}
                />

                <div className="chat-main">
                    <div className="chat-container">
                        <div className="chat-header">
                            <button
                                className="sidebar-collapse-btn"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                                aria-label="Toggle sidebar"
                            >
                                <FontAwesomeIcon icon={faAngleDoubleLeft} />
                            </button>
                            <h1>AI Tutor</h1>
                        </div>

                        <div id="chat-messages" ref={chatMessagesRef} onScroll={scheduleScrollToBottomVisibilityUpdate}>
                            {history.map(msg => <MessageBubble key={msg.id} message={msg} />)}
                        </div>

                        <button
                            ref={scrollToBottomButtonRef}
                            type="button"
                            className="scroll-to-bottom-btn"
                            style={scrollToBottomButtonStyle}
                            onClick={scrollToBottom}
                            title="Go to latest message"
                            aria-label="Go to latest message"
                            tabIndex={showScrollToBottom ? 0 : -1}
                        >
                            <FontAwesomeIcon icon={faArrowDown} />
                        </button>

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
                </div>
            </div>
        </>
    );
};

export default Chatbot;