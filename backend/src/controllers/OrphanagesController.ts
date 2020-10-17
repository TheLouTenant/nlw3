import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import * as Yup from 'yup';
import Orphanage from '../models/Orphanage';
import orphanagesView from '../views/orphanages_view';

export default {
  async index(request: Request, response: Response) {
    const orphanagesRepository = getRepository(Orphanage);

    const orphanages = await orphanagesRepository.find({
      relations: ['images'],
    });

    return response.json(orphanagesView.renderMany(orphanages));
  },

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const orphanagesRepository = getRepository(Orphanage);

    const orphanage = await orphanagesRepository.findOneOrFail(id, {
      relations: ['images'],
    });

    return response.json(orphanagesView.render(orphanage));
  },

  async create(request: Request, response: Response) {
    const {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
    } = request.body;

    const orphanagesRepository = getRepository(Orphanage);
    const requestImages = request.files as Express.Multer.File[];

    const images = requestImages.map((image) => {
      return {
        path: image.filename,
      };
    });

    const data = {
      name,
      latitude,
      longitude,
      about,
      instructions,
      opening_hours,
      open_on_weekends,
      images,
    };

    const schema = Yup.object().shape({
      name: Yup.string().required('Name é um campo obrigatório'),
      latitude: Yup.number().required('Latitude é um campo obrigatório'),
      longitude: Yup.number().required('Longitude é um campo obrigatório'),
      about: Yup.string().required('About é um campo obrigatório').max(300),
      instructions: Yup.string().required(
        'Instructions é um campo obrigatório'
      ),
      opening_hours: Yup.string().required(
        'Opening Hours é um campo obrigatório'
      ),
      open_on_weekends: Yup.boolean(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required('Path é um campo obrigatório'),
        })
      )
        .required()
        .min(1),
    });

    await schema.validate(data, {
      abortEarly: false,
    });

    const orphanage = orphanagesRepository.create(data);

    await orphanagesRepository.save(orphanage);

    return response.status(201).json(orphanagesView.render(orphanage));
  },
};