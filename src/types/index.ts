export interface Person {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tags: string[];
}

export interface PathJourney {
  id: string;
  person_id: string;
  path_id: string;
  step_id: string;
  step_number: number;
}

export interface Path {
  id: string;
  slug: string;
  name: string;
  status: string;
}

export interface TagToPathMapping {
  sourceTag: string;
  targetPathSlug: string;
  targetStepNumber: number;
}

export interface AppConfig {
  nationBuilderApiToken: string;
  nationBuilderSlug: string;
  tagMappings: TagToPathMapping[];
  simulationMode: boolean;
}
