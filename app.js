const express = require('express')
const app = express()
const path = require('path')
const bcrypt = require('bcrypt')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbpath = path.join(__dirname, 'userData.db')
app.use(express.json())

let db = null
const initilizeDBandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('SERVER started enjoy pandagoww...')
    })
  } catch (e) {
    console.log(`An error occured ${e.message}`)
    process.exit(-1)
  }
}
initilizeDBandserver()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const usernamecheckquery = `SELECT * FROM user WHERE username="${username}"`
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const usernameresfromdb = await db.get(usernamecheckquery)
  if (usernameresfromdb === undefined) {
    if (request.body.password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const queryforadd = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`
      const addrespfromdb = await db.run(queryforadd)
      response.status(200)

      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

/// login
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const queryuserexist = `SELECT * FROM user WHERE username="${username}"`
  const userResposne = await db.get(queryuserexist)

  if (userResposne === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const comparePasswords = await bcrypt.compare(
      password,
      userResposne.password,
    )

    if (comparePasswords === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

/// change-password!
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const queryforcomparepassword = `SELECT * FROM user WHERE username="${username}";`
  const newhashedpassword = await bcrypt.hash(request.body.newPassword, 10)

  const resfromdb = await db.get(queryforcomparepassword)
  if (resfromdb === undefined) {
    response.status(400)
    response.send('User not exist')
  } else {
    const comparePasswords = await bcrypt.compare(
      oldPassword,
      resfromdb.password,
    )
    if (comparePasswords === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const queryforupdate = `UPDATE user SET username="${username}",password="${newhashedpassword}" WHERE password="${oldPassword}"`
        const resfromdbaboutUpdate = await db.run(queryforupdate)

        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
