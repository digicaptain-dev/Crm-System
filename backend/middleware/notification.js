// Notification middleware function
const sendNotificationToAdmin = (io) => (req, res, next) => {
    const { dealId } = req.params;
    const { comment, user_name } = req.body; // Assuming the request body contains these fields

    // Construct the notification data
    const notificationData = {
        dealId,
        comment,
        user_name,
        time: new Date(),
    };

    // Emit notification to the admin's room
    io.emit('newCommentNotification', notificationData);

    // Call next to move to the next middleware or route handler
    next();
};

module.exports = sendNotificationToAdmin;