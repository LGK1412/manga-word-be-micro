import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Genre } from 'libs/Schema/genre/genre.schema';
import { Model } from 'mongoose';

@Injectable()
export class GenreService {
  constructor(
    @InjectModel(Genre.name) private genreModel: Model<Genre>,
  ) { }

  async createGenre(name: string, description?: string) {
    try {
      const newGenre = new this.genreModel({ name, description });
      await newGenre.save();
      return { success: true, message: 'Genre created sucessfully' };

    } catch (err: any) {
      if (err.code === 11000) {
        return {
          success: false,
          message: `Genre '${name}' already exists`
        };
      }

      return {
        success: false,
        message: `internal server error`
      };
    }
  }

  async updateGenre(id: string, name?: string, description?: string) {

    const updated = await this.genreModel.findByIdAndUpdate(id, { name, description }, { new: true });
    if (!updated) {
      return {
        success: false,
        message: `Genre udpated failed`
      };
    }
    return {
      success: true,
      message: `Genre udpated sucessfully`
    };
  }
}
