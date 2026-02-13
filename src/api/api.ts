export async function apiFetch(
    url: string,
    options: RequestInit = {}
) {
    const token = localStorage.getItem("jwt");

    const res = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error("API error");
    }

    return res.json();
}
