import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Style } from 'libs/Schema/style/style.schema';
import { Model } from 'mongoose';

@Injectable()
export class StyleService {
  constructor(
    @InjectModel(Style.name) private styleModel: Model<Style>
  ) { }

  async createStyle(name: string, description?: string, status?: string) {
    status = status || 'normal'
    try {
      const newStyle = new this.styleModel({ name, description, status });
      await newStyle.save();
      return { success: true, message: 'Style created sucessfully' };

    } catch (err: any) {
      if (err.code === 11000) {
        return {
          success: false,
          message: `Style '${name}' already exists`
        };
      }

      return {
        success: false,
        message: `internal server error`
      };
    }
  }

  async updateStyle(id: string, name?: string, description?: string, status?: string) {
    const updated = await this.styleModel.findByIdAndUpdate(id, { name, description, status }, { new: true });
    if (!updated) {
      return {
        success: false,
        message: `Style udpated failed`
      };
    }
    return {
      success: true,
      message: `Style udpated sucessfully`
    };
  }

  async validateStyle(style_id: string){
    return await this.styleModel.findById(style_id)
  }
}
