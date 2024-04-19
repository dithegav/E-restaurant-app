const Post = require ('../models/Post');

exports.getAllPosts = async (req, res, next) => {
    res.send("Get all post route");
}

exports.createNewPost = async (req, res, next) => {
    let {name, password, lastName, userType} = req.body;
    
    let user = new Post(name, password, lastName, userType);
    
    user = await user.save();
    console.log(user);
    res.send("Create new post route");
}

exports.getPostById = async (req, res, next) => {
    res.send("Get post by Id route");
}