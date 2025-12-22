// src/utils/tailwindCheck.ts
export const checkTailwindClasses = () => {
  const testClasses = [
    'bg-blue-500', 'text-white', 'p-4', 'rounded-lg',
    'grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3',
    'dark:bg-gray-800', 'dark:text-white'
  ];

  console.log('🔍 Verificando classes Tailwind:', testClasses);
  return testClasses;
};
