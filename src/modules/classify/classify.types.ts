export interface Classification {
  id: string;
  name: string;
  gender: string | null;
  probability: number;
  sampleSize: number;
  isConfident: boolean;
  createdAt: Date;
}

export class ClassifyExternalApiResponse {
  name!: string;
  gender!: string | null;
  probability!: number;
  count!: number;
}

export class ClassifyResponse {
  name!: string;
  gender!: string | null;
  probability!: number;
  sample_size!: number;
  is_confident!: boolean;
}
