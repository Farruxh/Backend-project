import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/video/:videoId").patch(toggleVideoLike);
router.route("/toggle/comment/:commentId").patch(toggleCommentLike);
router.route("/toggle/tweet/:tweetId").patch(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router