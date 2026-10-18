"use client";

import {
    FormEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    MessageCircle,
    Send,
    X,
} from "lucide-react";

import { authenticatedFetch } from "@/lib/api";

interface ChatMessageResponse {
    id: number;
    sender: "USER" | "BOT";
    content: string;
    createdAt: string;
}

interface ChatResponse {
    userMessage: ChatMessageResponse;
    botMessage: ChatMessageResponse;
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false);

    const [messages, setMessages] =
        useState<ChatMessageResponse[]>([]);

    const [message, setMessage] = useState("");

    const [loadingHistory, setLoadingHistory] =
        useState(false);

    const [sending, setSending] =
        useState(false);

    const [error, setError] = useState("");

    const messagesEndRef =
        useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (open && messages.length === 0) {
            loadHistory();
        }
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    }, [messages, open]);

    async function loadHistory() {
        setLoadingHistory(true);
        setError("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/chat/history"
            );

            if (!response.ok) {
                throw new Error(
                    "Could not load chat history."
                );
            }

            const data: ChatMessageResponse[] =
                await response.json();

            setMessages(data);
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not load chat history."
            );
        } finally {
            setLoadingHistory(false);
        }
    }

    async function handleSend(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const trimmedMessage = message.trim();

        if (!trimmedMessage || sending) {
            return;
        }

        setSending(true);
        setError("");

        try {
            const response = await authenticatedFetch(
                "http://localhost:8080/api/chat/message",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: trimmedMessage,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => null);

                throw new Error(
                    errorData?.message ??
                    "Could not send message."
                );
            }

            const data: ChatResponse =
                await response.json();

            setMessages((current) => [
                ...current,
                data.userMessage,
                data.botMessage,
            ]);

            setMessage("");
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Could not send message."
            );
        } finally {
            setSending(false);
        }
    }

    function formatTime(value: string) {
        return new Date(value).toLocaleTimeString(
            "en-GB",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    }

    return (
        <>
            {open && (
                <section className="chat-widget">
                    <header className="chat-widget-header">
                        <div className="chat-widget-agent">
                            <div className="chat-widget-avatar">
                                CM
                            </div>

                            <div>
                                <strong>
                                    ClutchMetrics Assistant
                                </strong>

                                <span>Online</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="chat-widget-close"
                            onClick={() => setOpen(false)}
                            aria-label="Close chat"
                        >
                            <X size={18} />
                        </button>
                    </header>

                    <div className="chat-widget-messages">
                        {loadingHistory ? (
                            <div className="chat-widget-state">
                                Loading conversation...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="chat-widget-welcome">
                                <div className="chat-widget-welcome-icon">
                                    <MessageCircle size={22} />
                                </div>

                                <strong>
                                    How can I help?
                                </strong>

                                <p>
                                    Ask me about your ClutchMetrics
                                    account, statistics or platform
                                    features.
                                </p>
                            </div>
                        ) : (
                            messages.map((chatMessage) => (
                                <div
                                    className={
                                        chatMessage.sender === "USER"
                                            ? "chat-message user"
                                            : "chat-message bot"
                                    }
                                    key={chatMessage.id}
                                >
                                    <div className="chat-message-bubble">
                                        {chatMessage.content}
                                    </div>

                                    <span className="chat-message-time">
                    {formatTime(
                        chatMessage.createdAt
                    )}
                  </span>
                                </div>
                            ))
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {error && (
                        <div className="chat-widget-error">
                            {error}
                        </div>
                    )}

                    <form
                        className="chat-widget-form"
                        onSubmit={handleSend}
                    >
                        <input
                            type="text"
                            value={message}
                            maxLength={1000}
                            onChange={(event) =>
                                setMessage(event.target.value)
                            }
                            placeholder="Type a message..."
                            disabled={sending}
                        />

                        <button
                            type="submit"
                            disabled={
                                sending || !message.trim()
                            }
                            aria-label="Send message"
                        >
                            <Send size={17} />

                            <span>
                {sending ? "..." : "Send"}
              </span>
                        </button>
                    </form>
                </section>
            )}

            <button
                type="button"
                className={
                    open
                        ? "chat-widget-launcher open"
                        : "chat-widget-launcher"
                }
                onClick={() => setOpen((current) => !current)}
                aria-label={
                    open
                        ? "Close ClutchMetrics Assistant"
                        : "Open ClutchMetrics Assistant"
                }
            >
                {open ? (
                    <X size={22} />
                ) : (
                    <MessageCircle size={22} />
                )}
            </button>
        </>
    );
}