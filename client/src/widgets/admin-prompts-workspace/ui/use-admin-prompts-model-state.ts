import { useState, type Dispatch, type SetStateAction } from 'react';

import type { ModelFilter, ResponseFormat } from '../model/types';

export interface AdminPromptsModelState {
  model: string;
  setModel: Dispatch<SetStateAction<string>>;
  temperature: string;
  setTemperature: Dispatch<SetStateAction<string>>;
  responseFormat: ResponseFormat;
  setResponseFormat: Dispatch<SetStateAction<ResponseFormat>>;
  systemRole: string;
  setSystemRole: Dispatch<SetStateAction<string>>;
  maxTokens: string;
  setMaxTokens: Dispatch<SetStateAction<string>>;
  modelSearch: string;
  setModelSearch: Dispatch<SetStateAction<string>>;
  modelFilter: ModelFilter;
  setModelFilter: Dispatch<SetStateAction<ModelFilter>>;
}

/** OpenRouter request settings plus the model-picker filters. */
export function useAdminPromptsModelState(): AdminPromptsModelState {
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('json');
  const [systemRole, setSystemRole] = useState('Career Counselor Expert');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [modelSearch, setModelSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('free');

  return {
    model,
    setModel,
    temperature,
    setTemperature,
    responseFormat,
    setResponseFormat,
    systemRole,
    setSystemRole,
    maxTokens,
    setMaxTokens,
    modelSearch,
    setModelSearch,
    modelFilter,
    setModelFilter,
  };
}
