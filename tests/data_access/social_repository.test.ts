import { describe, test, expect, beforeEach, suite } from "vitest";
import { db } from "../../src/drizzle/db.js";
import { SocialNotifications } from "../../src/drizzle/schema.js";
import { SocialRepository } from "../../src/data_access/social_repository.js";
import { NewFollowerInput } from "../../src/schemas/social_schema.js"; 

suite("Social Repository", () => {
    let repository = new SocialRepository(db);
    
    let testAddresseeId = "95a62132-8602-4df2-87fe-cba5432f442d"; 
    let testFollowerId = "55555555-5555-5555-5555-555555555555";
    let otherAddresseeId = "3f8b89e3-2c1a-4b98-9e5d-1c8a6b2d4e7f";
    
    beforeEach(async () => {
        await db.delete(SocialNotifications);
    });

    describe("Store New Follower Notification", () => {
        test("Should successfully insert a new follower notification into the database", async () => {
            const input: NewFollowerInput = {
                followedId: testAddresseeId,
                newFollowerId: testFollowerId
            };

            const result = await repository.storeNewFollowerNotification(input);

            expect(result).not.toBeUndefined();
            expect(result?.addresseeId).toBe(testAddresseeId);
            expect(result?.markedAsRead).toBe(false); // Default value from schema
            expect(result?.type).toBe("socials");      // Default value from schema
            
            // Note: The repository stringifies the JSON. Depending on the postgres driver, 
            // returning() might parse it back to an object or leave it as a string. 
            // We check if it matches the stringified version or the parsed object.
            const parsedBody = typeof result?.messageBody === "string" 
                ? JSON.parse(result.messageBody) 
                : result?.messageBody;
                
            expect(parsedBody).toEqual({
                followedId: testAddresseeId,
                newFollowerId: testFollowerId
            });

            // Verify it was actually saved in the DB by retrieving it
            const unreadInDb = await repository.getUnreadNotifications(testAddresseeId);
            expect(unreadInDb).toHaveLength(1);
            expect(unreadInDb[0]?.addresseeId).toBe(testAddresseeId);
        });
    });

    describe("Get Unread Notifications", () => {
        test("Should retrieve only unread notifications for the specified addressee", async () => {
            const testDate = new Date();
            
            await db.insert(SocialNotifications).values([
                {
                    id: "11111111-1111-1111-1111-111111111111",
                    addresseeId: testAddresseeId,
                    messageBody: { message: "Unread social notification 1" },
                    markedAsRead: false,
                    receivedAt: testDate
                },
                {
                    id: "22222222-2222-2222-2222-222222222222",
                    addresseeId: testAddresseeId,
                    messageBody: { message: "Read social notification 1" },
                    markedAsRead: true,
                    receivedAt: testDate
                },
                {
                    id: "33333333-3333-3333-3333-333333333333",
                    addresseeId: otherAddresseeId,
                    messageBody: { message: "Unread notification for someone else" },
                    markedAsRead: false,
                    receivedAt: testDate
                }
            ]);

            const result = await repository.getUnreadNotifications(testAddresseeId);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect(result[0]?.addresseeId).toBe(testAddresseeId);
            expect(result[0]?.markedAsRead).toBe(false);
            expect(result[0]?.messageBody).toEqual({ message: "Unread social notification 1" });
        });

        test("Should return an empty array if there are no unread notifications", async () => {
            await db.insert(SocialNotifications).values({
                id: "11111111-1111-1111-1111-111111111111",
                addresseeId: testAddresseeId,
                messageBody: { message: "Already read social notification" },
                markedAsRead: true
            });

            const result = await repository.getUnreadNotifications(testAddresseeId);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(0);
        });
    });

    describe("Mark Notification As Read", () => {
        test("Should update the notification to read and return the updated object", async () => {
            const notificationId = "11111111-1111-1111-1111-111111111111";
            
            await db.insert(SocialNotifications).values({
                id: notificationId,
                addresseeId: testAddresseeId,
                messageBody: { message: "Please read me" },
                markedAsRead: false
            });

            const result = await repository.markNotificationAsRead(notificationId);

            // Verify the object is returned and updated correctly
            expect(result).not.toBeUndefined();
            expect(result?.id).toBe(notificationId);
            expect(result?.markedAsRead).toBe(true);
            
            // Verify it actually changed in the database
            const unreadInDb = await repository.getUnreadNotifications(testAddresseeId);
            expect(unreadInDb).toHaveLength(0);
        });

        test("Should return undefined if the notification does not exist", async () => {
            const nonExistentId = "99999999-9999-9999-9999-999999999999";
            
            const result = await repository.markNotificationAsRead(nonExistentId);

            expect(result).toBeUndefined();
        });
    });
});
