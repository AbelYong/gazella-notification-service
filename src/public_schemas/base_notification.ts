
export interface BaseNotification<T> {
    id: string;
    type: string;
    addresseeId: string;
    messageBody: T;
    markedAsRead: boolean;
    receivedAt: string; 
}
