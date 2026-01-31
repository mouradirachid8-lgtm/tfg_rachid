import { Request, Response } from 'express';
import { query } from './db';

// OBTIENE EL DIAGRAMA (O crea uno vacío si es la primera vez)
export const getProjectDiagram = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;

    try {
        // 1. Buscamos si ya existe un diagrama para este proyecto
        const result = await query(
            'SELECT * FROM diagrams WHERE project_id = $1',
            [projectId]
        );

        if (result.rows.length > 0) {
            // Si existe, lo devolvemos
            return res.json(result.rows[0]);
        } else {
            // 2. Si NO existe, creamos uno por defecto (Lazy Creation)
            const defaultContent: never[] = [];
            
            const newDiagram = await query(
                `INSERT INTO diagrams (project_id, name, content) 
                 VALUES ($1, $2, $3) RETURNING *`,
                [projectId, 'Diagrama Principal', JSON.stringify(defaultContent)]
            );
            
            return res.json(newDiagram.rows[0]);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el diagrama' });
    }
};

// GUARDA EL ESTADO DEL DIAGRAMA
export const saveProjectDiagram = async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const { content } = req.body; // Aquí viene todo el JSON de Vue Flow

    try {
        // Actualizamos el campo 'content' y la fecha 'updated_at'
        const result = await query(
            `UPDATE diagrams 
             SET content = $1, updated_at = NOW() 
             WHERE project_id = $2 
             RETURNING *`,
            [JSON.stringify(content), projectId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Diagrama no encontrado' });
        }

        res.json({ message: 'Guardado correctamente', diagram: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al guardar el diagrama' });
    }
};