const Chat = require("../models/Chat");
const User = require("../models/User");


module.exports = {

    accessChat : async (req,res) => {
        const {userId} = req.body;
        if(
            !userId
        ){
            res.status(400).json("Invalid user ID");
        }
        var isChat = await Chat.find({
            isGroupChat : false,
            $and : [
                { users: {$elemMatch : {$eq: req.user.id}}},  
                { users: {$elemMatch : {$eq: userId}}},               
            ],
        })
            .populate("users", "-password")
            .populate("latestMessage");

        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "username profile email"
        });
        if(
            isChat.length > 0
        ){
            res.send(isChat[0]);
        } else {
            var chatData = {
                chatName: req.user.id,
                isGroupChat: false,
                users: [
                    req.user.id,userId
                ]
            };
            try {
                const createChat = await Chat.create(chatData);
                const FullChat = await Chat.findOne({_id: createChat._id}).populate(
                    "users", "-password"
                );
                res.status(200).json(FullChat);
            } catch (error) {
                res.status(400).json("Failed to create chat ")
            }
        }
    },



    getChat : async (req,res) => {
        try{
            Chat.find({
                users: {
                    $elemMatch : { $eq : req.user.id}
                }
            })
            .populate('users', "-password")
            .populate('groupAdmin', "-password")
            .populate('latestMessage')
            .sort ({ updateAt: -1 })
            .then(async (results)=> {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "username profile email",
                });
                res.status(200).json(results);
            })
        } catch(error){
            res.status(500).json("Failed to retrive Chat")
        }
    }
}