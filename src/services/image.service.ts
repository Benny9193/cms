import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

class ImageService {
  private uploadDir = path.join(process.cwd(), 'uploads');
  private thumbnailDir = path.join(this.uploadDir, 'thumbnails');

  async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.thumbnailDir, { recursive: true });
  }

  async optimizeImage(
    inputPath: string,
    outputPath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<void> {
    const {
      width,
      height,
      quality = 80,
      format = 'jpeg',
    } = options;

    await this.ensureDirectories();

    let image = sharp(inputPath);

    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    switch (format) {
      case 'jpeg':
        image = image.jpeg({ quality, progressive: true });
        break;
      case 'png':
        image = image.png({ quality, progressive: true });
        break;
      case 'webp':
        image = image.webp({ quality });
        break;
    }

    await image.toFile(outputPath);
  }

  async generateThumbnail(
    inputPath: string,
    filename: string,
    sizes: number[] = [150, 300, 600]
  ): Promise<{ size: number; path: string; url: string }[]> {
    await this.ensureDirectories();

    const thumbnails = await Promise.all(
      sizes.map(async (size) => {
        const thumbFilename = `thumb_${size}_${filename}`;
        const thumbPath = path.join(this.thumbnailDir, thumbFilename);

        await this.optimizeImage(inputPath, thumbPath, {
          width: size,
          height: size,
          quality: 80,
        });

        return {
          size,
          path: thumbPath,
          url: `/uploads/thumbnails/${thumbFilename}`,
        };
      })
    );

    return thumbnails;
  }

  async getImageMetadata(filePath: string) {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
  }

  async convertToWebP(inputPath: string, outputPath: string): Promise<void> {
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
  }
}

export default new ImageService();
