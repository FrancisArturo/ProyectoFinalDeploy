import passport from "passport";
import userModel from "../models/user.models.js";
import GithubStrategy from "passport-github2";
import jwt from "passport-jwt";
import { cookieExtractor } from "../utils/jwt.js";
import { cartModel } from "../models/cart.models.js";





const JWTStrategy = jwt.Strategy;
const ExtractJWT = jwt.ExtractJwt;




const initializePassport = () => {

    passport.use("jwt", new JWTStrategy(
        {
            jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]),
            secretOrKey: process.env.SECRET_CODE_JWT,
        },
        async (jwtPayload, done) => {
            try {
                return done(null, jwtPayload);
            } catch (err) {
                return done(err)
            }
        }
    ))



    passport.use(new GithubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await userModel.findOne({ email: profile._json.email });
            if (user) {
                return done(null, user);
            } else {
                const cart = {
                    products: []
                }
                const cartUser = await cartModel.create(cart);
                user = await userModel.create({
                    firstName: profile._json.name,
                    lastName: "",
                    email: profile._json?.email,
                    password: "",
                    phone: "",
                    role: "user",
                    carts: cartUser._id,
                }); 
                const userUpdate = await userModel.updateOne({ email: user.email }, {carts : cartUser._id });
                user = await userModel.findOne({ email: user.email });
                return done(null, user);
            }
        } catch (error) {
            return done(error);
        }
    }
    ));



    passport.serializeUser((user, done) => {
        done(null, user._id);
    });
    passport.deserializeUser(async (id, done) => {
        try {
            let user = await userModel.findById({ _id: id });;
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    });
}

export default initializePassport;