export class CreateClassificationDTO {
  name!: string;
  gender!: string | null;
  probability!: number;
  sampleSize!: number;
  isConfident!: boolean;
}

export class UpdateClassificationDTO {
  gender!: string | null;
  probability!: number;
  sampleSize!: number;
  isConfident!: boolean;
}

export class ClassifyQueryDTO {
  name!: string;
}
