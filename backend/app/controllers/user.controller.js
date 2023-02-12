const UserService = require("../services/user.service");
const AuthService = require("../services/auth.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const jwt = require("jsonwebtoken");
const config = require("../config");

exports.logOut = async (req, res, next) => {
    res.clearCookie('refreshToken');
    res.send({ message: "Log Out" })
};

exports.refreshToken = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return next(
        new ApiError(400, "You're not authenticated")
    );
    const authService = new AuthService(MongoDB.client);
    jwt.verify(refreshToken, config.JWT_Secret, async (error, user) => {
        if (error) return next(
            new ApiError(400, "Token is not valid")
        );

        const newAccessToken = await authService.signIn(user, "2h");
        const newRefreshToken = await authService.signIn(user, "3d");
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            path: "/",
            sameSite: "strict",
        });
        return res.send({ AccessToken: newAccessToken });
    })
}

exports.addFriend = async (req, res, next) => {
    try {
        const authHeader = await req.header('Authorization');
        const token = await authHeader.split(' ')[1];
        if (!token) return next(new ApiError(400, "You're not authoticated"));

        jwt.verify(token, config.JWT_Secret, async (error, user) => {
            if (error) return next(new ApiError(400, "Token is not valid"));
            const userService = new UserService(MongoDB.client);

            const FoundUser = await userService.findById(req.params.id);
            if(!FoundUser) {
                return next(new ApiError(400, "User does not exist"));
            }

            const FoundlistFriend = await userService.findListFriend(user.id,req.params.id);
            if(FoundlistFriend) {
                return next(new ApiError(400, "User already exists in friends list"));
            }

            const document = await userService.addFriend(user.id, req.params.id);
            if (!document) {
                return next(new ApiError(404, "User not found"))
            }
            
            return res.send({ message: "User was add successfully" });
        });
    } catch (error) {
        return next(
            new ApiError(500, `Error update user with id=${req.params.id}`)
        );
    }
};

exports.unFriend = async (req, res, next) => {

};
//Retrieve all users of a user from the database
exports.findAll = async (req, res, next) => {
    let documents = [];
    try {
        const userService = new UserService(MongoDB.client);
        const { name } = req.query;

        if (name) {
            documents = await userService.findByName(name);
        } else {
            documents = await userService.find({});
        }
        return res.send(documents);
    } catch (error) {
        return next(
            new ApiError(500, "An error occurred while retrieving the users")
        );
    }
};

//
exports.findOne = async (req, res, next) => {
    try {
        const userService = new UserService(MongoDB.client);
        const document = await userService.findById(req.params.id);
        if (!document) {
            return next(new ApiError(404, "User not found"));
        }
        return res.send(document);
    } catch (error) {
        return next(
            new ApiError(500, `Error retrieving user with id=${req.params.id}`)
        );
    }
};

exports.update = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return next(ApiError(400, "Data to update can not be empty"));
    }

    try {
        const userService = new UserService(MongoDB.client);
        const document = await userService.update(req.params.id, req.body);
        if (!document) {
            return new (ApiError(404, "User not found"))
        }
        return res.send({ message: "User was update successfully" });
    } catch (error) {
        return next(
            new ApiError(500, `Error update user with id=${req.params.id}`)
        );
    }
};

exports.delete = async (req, res, next) => {
    try {
        const userService = new UserService(MongoDB.client);
        const document = await userService.delete(req.params.id);
        if (!document) {
            return next(new ApiError(404, "User not found"));
        }
        return res.send({ message: "User was deleted successfully" });
    } catch (error) {
        return next(
            new ApiError(500, `Could not delete user with id=${req.params.id}`)
        );
    }
};
