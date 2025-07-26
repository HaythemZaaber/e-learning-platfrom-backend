import {
  Controller,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';


@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp(
            /.jpg|.jpeg|.png|.gif|.bmp|.webp|.pdf|.docx|.xlsx|.xlx|.pptx|.ppt|.mp4|.csv|.doc|.msword$/i,
          ),
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 50,
        })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.createFile(
      file,
      'ThisIsTheFileName', // optional
      'This/is/the/path', // optional
    );
  }
}
