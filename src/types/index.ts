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
}

export interface Path {
  id: string;
  name: string;
  status: string;
}

export interface PathStep {
  id: string;
  name: string;
  step_number: number;
  path_id: string;
}

export interface TagToPathMapping {
  sourceTag: string;
  targetPathName: string;
  targetStepName: string;
}

export interface AppConfig {
  nationBuilderApiToken: string | null;
  oauthClientId: string | null;
  oauthClientSecret: string | null;
  nationBuilderSlug: string;
  tagMappings: TagToPathMapping[];
  simulationMode: boolean;
}
