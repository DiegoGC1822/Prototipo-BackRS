import OpenAI from "openai";
import express from "express";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

const app = express();
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const { dinero, aprobacion } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
Eres un generador de eventos para el juego Rector Simulator. Genera un evento aleatorio en la siguiente estructura JSON:

{
   "evento": "Descripción corta del evento.",
   "personaje": "profesora" | "estudiante" | "periodista" | "secretaria",
   "decision1": {
       "decision": "Descripción de la primera decision basada en el evento.",
       "consecuencia": {
           "recurso": "aprobacion" | "dinero",
           "accion": Número entre -20 y 20
       }
   },
   "decision2": {
       "decision": "Descripción de la segunda decision basada en el evento.",
       "consecuencia": {
           "recurso": "aprobacion" | "dinero",
           "accion": Número entre -20 y 20
       }
   }
}

Los recursos actuales son:
- Dinero: ${dinero}
- Aprobacion: ${aprobacion}

Genera eventos que consideren este estado. Asegúrate de que el JSON sea válido y no agregues texto adicional.
          `,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extraer y parsear la respuesta
    const respuesta = completion.choices[0].message.content;

    let evento;
    try {
      evento = JSON.parse(respuesta);
    } catch (error) {
      return res.status(500).json({
        error: "Error al parsear el JSON generado por la API.",
        detalles: respuesta,
      });
    }

    // Validar la estructura del JSON
    const personajesValidos = [
      "profesora",
      "estudiante",
      "periodista",
      "secretaria",
    ];
    const recursosValidos = ["aprobacion", "dinero"];

    if (
      !evento.evento ||
      !personajesValidos.includes(evento.personaje) ||
      !evento.decision1 ||
      !evento.decision2 ||
      !recursosValidos.includes(evento.decision1.consecuencia.recurso) ||
      !recursosValidos.includes(evento.decision2.consecuencia.recurso) ||
      typeof evento.decision1.consecuencia.accion !== "number" ||
      typeof evento.decision2.consecuencia.accion !== "number" ||
      evento.decision1.consecuencia.accion < -20 ||
      evento.decision1.consecuencia.accion > 20 ||
      evento.decision2.consecuencia.accion < -20 ||
      evento.decision2.consecuencia.accion > 20
    ) {
      return res.status(500).json({
        error: "El JSON generado no cumple con la estructura requerida.",
        detalles: evento,
      });
    }

    // Responder con el evento generado
    res.json(evento);
  } catch (error) {
    console.error("Error al generar el evento:", error);
    res.status(500).json({ error: "Error al generar el evento." });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
