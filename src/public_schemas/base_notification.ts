
export interface BaseNotification<T> {
    id: string;
    addresseeId: string;
    messageBody: T;
    markedAsRead: boolean;
    createdAt: string; 
}
