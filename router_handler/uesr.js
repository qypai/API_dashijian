// 导入数据库操作模块
const db = require('../db/index')
    // 导入bcrypt这个包
const bcrypt = require('bcryptjs')
    // 导入生产token字符串包
const jwt = require('jsonwebtoken')


exports.regUser = (req, res) => {
    // 接收表单数据
    const userinfo = req.body
        // console.log(userinfo);
        // 判断数据是否合法
        // if (!userinfo.username || !userinfo.password) {
        //     return res.cc('用户名或密码不能为空')
        // }
        // 定义sql语句
    const sqlStr = `select * from ev_users where username=?`

    db.query(sqlStr, userinfo.username, function(err, results) {
        // 执行 SQL 语句失败
        if (err) {
            return res.cc(err)
        }
        // 用户名被占用
        if (results.length > 0) {
            return res.cc('用户名被占用，请更换其他用户名！')
        }
        // TODO: 用户名可用，继续后续流程...
        // 调用bcrypt.hashsync()对密钥进行加密

        userinfo.password = bcrypt.hashSync(userinfo.password, 10)
        const sql = 'insert into ev_users set ?'
        db.query(sql, { username: userinfo.username, password: userinfo.password }, function(err, results) {
            // 执行 SQL 语句失败
            if (err) return res.cc(err)
                // SQL 语句执行成功，但影响行数不为 1
            if (results.affectedRows !== 1) {
                return res.cc('注册失败')
            }
            // 注册成功
            res.cc('注册成功', 0)
        })


    })




}
exports.login = (req, res) => {
    const userinfo = req.body
    const sql = `select * from ev_users where username=?`
    db.query(sql, userinfo.username, function(err, results) {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
            // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        if (results.length !== 1) return res.cc('登录失败！')
            // TODO：判断用户输入的登录密码是否和数据库中的密码一致
            // 拿着用户输入的密码,和数据库中存储的密码进行对比
        const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)

        // 如果对比的结果等于 false, 则证明用户输入的密码错误
        if (!compareResult) {
            return res.cc('登录失败！')
        }

        // TODO：登录成功，生成 Token 字符串
        // 剔除完毕之后，user 中只保留了用户的 id, username, nickname, email 这四个属性的值
        const user = {...results[0], password: '', user_pic: '' }
            // 导入配置文件
        const config = require('../config')

        // 生成 Token 字符串
        const tokenStr = jwt.sign(user, config.jwtSecretKey, {
            expiresIn: '10h', // token 有效期为 10 个小时
        })
        res.send({
            status: 0,
            message: '登录成功！',
            // 为了方便客户端使用 Token，在服务器端直接拼接上 Bearer 的前缀
            token: 'Bearer ' + tokenStr,
        })


    })


}