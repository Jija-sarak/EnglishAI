export interface LessonData {
  id: string;
  title: string;
  [key: string]: any;
}

export interface SectionData {
  title: string;
  description: string;
  xpRequired: number;
  lessons: LessonData[];
}

export interface SkillData {
  beginner: SectionData;
  intermediate: SectionData;
  advanced: SectionData;
}

const skillFiles = {
  listening: '/data/listening.json',
  reading: '/data/reading.json',
  speaking: '/data/speaking.json',
  writing: '/data/writing.json',
  grammar: '/data/grammar.json',
  vocabulary: '/data/vocabulary.json'
};

export async function loadSkillData(skill: keyof typeof skillFiles): Promise<SkillData> {
  try {
    const response = await fetch(skillFiles[skill]);
    if (!response.ok) {
      throw new Error(`Failed to load ${skill} data`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${skill} data:`, error);
    throw error;
  }
}

export async function loadLessonData(skill: keyof typeof skillFiles, level: 'beginner' | 'intermediate' | 'advanced'): Promise<SectionData> {
  const skillData = await loadSkillData(skill);
  return skillData[level];
}