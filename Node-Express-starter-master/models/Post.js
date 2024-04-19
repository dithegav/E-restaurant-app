const db = require('../config/db');

class Post {

    constructor (name, password, lastName, userType) {
        this.name = name;
        this.password = password;
        this.lastName = lastName;
        this.userType = userType;
    }

    save() {
        let sql = `
            INSERT INTO users(
                name,
                password,
                lastName,
                userType
            ) 
            VALUES(
                '${this.name}',
                '${this.password}',
                '${this.lastName}',
                '${this.userType}'
            )`;

        return db.execute(sql);
        
    }

    static findAll () {
        let sql = "SELECT * FROM users;";

        return db.execute(sql);
    }

    static findById(id) {
        let sql = `SELECT * FROM users WHERE idUsers = ${id};`;

        return db.execute(sql);
    }
}

module.exports = Post;
