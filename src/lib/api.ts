const API_URL = "http://localhost:8080";

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
    const refreshToken =
        localStorage.getItem("refreshToken");

    if (!refreshToken) {
        return null;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/auth/refresh`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refreshToken,
                }),
            }
        );

        if (!response.ok) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            return null;
        }

        const data = await response.json();

        localStorage.setItem(
            "accessToken",
            data.accessToken
        );

        if (data.refreshToken) {
            localStorage.setItem(
                "refreshToken",
                data.refreshToken
            );
        }

        return data.accessToken;
    } catch (error) {
        console.error(
            "Erro ao renovar o access token:",
            error
        );

        return null;
    }
}

export async function refreshAccessToken(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    let accessToken =
        localStorage.getItem("accessToken");

    if (!accessToken) {
        throw new Error("NO_ACCESS_TOKEN");
    }

    let response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (
        response.status === 401 ||
        response.status === 403
    ) {
        accessToken = await refreshAccessToken();

        if (!accessToken) {
            throw new Error("SESSION_EXPIRED");
        }

        response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${accessToken}`,
            },
        });
    }

    return response;
}