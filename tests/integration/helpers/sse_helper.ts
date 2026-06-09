import { EventSource } from "eventsource";

export async function createTypedSseClient<T>(baseUrl: string, jwtToken: string) {
    const ticketResponse = await fetch(`${baseUrl}/tickets`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    
    if (!ticketResponse.ok) {
        throw new Error("Failed to get the SSE ticket");
    }
    const { ticket } = await ticketResponse.json();

    const eventSource = new EventSource(`${baseUrl}/stream?ticket=${ticket}`);

    const isReady = new Promise<void>((resolve) => {
        eventSource.onopen = () => resolve();
    });

    const nextMessage = new Promise<T>((resolve, reject) => {
        eventSource.onmessage = (event) => {
            try {
                resolve(JSON.parse(event.data) as T);
            } catch (err) {
                reject(err);
            }
        };
        eventSource.onerror = (err: any) => {
            console.error("SSE error details:", err); 
            reject(new Error("SSE Connection failed"));
        };
    });

    await isReady;

    return {
        eventSource,
        nextMessage,
        close: () => eventSource.close()
    };
}
