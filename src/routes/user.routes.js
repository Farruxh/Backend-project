import { Router } from "express"
import { logoutUser, registerUser } from "../controllers/user.controller.js"
import { loginUser } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()

router.route("/register").post(

    // middleware is using to get avatar and coverImage from user before sending user to registerUser controller
    upload.fields([
        {
          name: "avatar",
          maxCount: 1
        },
        {
          name: "coverImage",
          maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

router.route("/logout").post(logoutUser)
export default router 