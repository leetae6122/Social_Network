const { ObjectId } = require("mongodb");

class UserService {
    constructor(client) {
        this.User = client.db().collection("users");
    }
    // Định nghĩa các phương thức truy xuất CSDL sử dụng mongodb API
    extractUserData(payload) {
        const user = {
            username: payload.username,
            password: payload.password,
            fullname: payload.firstname+' '+payload.lastname,
            gender: payload.gender,
            email: payload.email,
            phone: payload.phone,
            admin: payload.admin,
        };
        // Xóa các trường không xác định       
        Object.keys(user).forEach(
            (key) => user[key] === undefined && delete user[key]
        );
        return user;
    }

    async find(filter) {
        const cursor = await this.User.find(filter);
        return await cursor.toArray();
    }

    async findByName(name) {
        return await this.find({
            fullname: { $regex: new RegExp(name), $options: "i" },
        });
    }

    async findById(id) {
        return await this.User.findOne({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null
        })
    }

    async findFriendsList(idUser, idAdd){
        return await this.User.findOne({
            _id:ObjectId.isValid(idUser) ? new ObjectId(idUser) : null,
            friends_list: idAdd
        });
    }

    async update(id, payload) {
        const filter = {
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
        }
        const update = this.extractUserData(payload);
        const result = await this.User.findOneAndUpdate(
            filter,
            { $set: update },
            { returnDocument: "after" }
        );
        return result.value;
    }

    async addFriend(idUser, idAdd) {
        const filter = {
            _id: ObjectId.isValid(idUser) ? new ObjectId(idUser) : null,
        };
        const update = {friends_list: idAdd};
        const result = await this.User.findOneAndUpdate(
            filter,
            { $push: update },
            { returnDocument: "after" }
        );
        return result.value;
    }

    async unFriend(idUser, idAdd) {
        const filter = {
            _id: ObjectId.isValid(idUser) ? new ObjectId(idUser) : null,
        };
        const update = {friends_list: idAdd};
        const result = await this.User.findOneAndUpdate(
            filter,
            { $pull: update },
            { returnDocument: "after" }
        );
        return result.value;
    }

    async delete(id) {
        const result = await this.User.findOneAndDelete({
            _id: ObjectId.isValid(id) ? new ObjectId(id) : null
        })
        return result.value;
    }

}
module.exports = UserService;