import express from 'express'
import bodyParser from 'body-parser'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from './config/firebaseServiceAccount.json'

const app = express()
const PORT = process.env.PORT || 3010

// Configuración de Firebase
initializeApp({
    credential: cert(serviceAccount)
})

const db = getFirestore()
const usuariosCollection = db.collection('usuarios')

app.use(bodyParser.json())

// Middleware para manejo de errores
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

// Crear (Create) con campo adicional
app.post('/usuarios', asyncHandler(async (req, res) => {
    const newUser = req.body
    if (!newUser.nombre || !newUser.email) {
        return res.status(400).json({ error: 'Nombre y email son requeridos' })
    }
    newUser.creadoPor = 'Tu Nombre' // Agrega tu nombre aquí
    const userRef = await usuariosCollection.add(newUser)
    res.status(201).json({ id: userRef.id })
}))

// Leer todos los usuarios (Read)
app.get('/usuarios', asyncHandler(async (req, res) => {
    const snapshot = await usuariosCollection.get()
    const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    res.status(200).json(usuarios)
}))

// Leer un usuario específico por ID (Read)
app.get('/usuarios/:id', asyncHandler(async (req, res) => {
    const userRef = usuariosCollection.doc(req.params.id)
    const doc = await userRef.get()
    if (!doc.exists) {
        return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.status(200).json({ id: doc.id, ...doc.data() })
}))

// Actualizar un usuario específico (Update)
app.put('/usuarios/:id', asyncHandler(async (req, res) => {
    const userRef = usuariosCollection.doc(req.params.id)
    const updatedData = req.body
    if (updatedData.creadoPor) {
        updatedData.creadoPor = 'Tu Nombre' // Asegúrate de que el campo `creadoPor` tenga tu nombre
    }
    await userRef.update(updatedData)
    res.status(200).json({ message: 'Usuario actualizado' })
}))

// Borrar un usuario específico (Delete)
app.delete('/usuarios/:id', asyncHandler(async (req, res) => {
    const userRef = usuariosCollection.doc(req.params.id)
    await userRef.delete()
    res.status(200).json({ message: 'Usuario borrado' })
}))

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Algo salió mal, por favor intenta de nuevo más tarde' })
})

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`)
})
