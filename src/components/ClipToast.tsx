
"use client";

interface ClipToastProps {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}

export default function ClipToast({
                                      message,
                                      type,
                                      onClose,
                                  }: ClipToastProps) {
    if (!message) return null;

    const isError = type === "error";

    return (
        <div
            className={`cm-toast cm-toast-${type}`}
            role={isError ? "alert" : "status"}
        >
            <div className="cm-toast-icon">
                {isError ? "!" : "✓"}
            </div>

            <div className="cm-toast-content">
                <strong>
                    {isError ? "Action required" : "Success!"}
                </strong>

                <p>{message}</p>
            </div>

            <button
                type="button"
                className="cm-toast-close"
                onClick={onClose}
                aria-label="Close notification"
            >
                ×
            </button>
        </div>
    );
}
