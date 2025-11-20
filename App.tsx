import React, { useState, useCallback, useRef } from 'react';
import { STUDIO_PROMPTS } from './constants';
import { generateStudioImage, generateNewPrompts, generateStudioVideo, modifyPromptForJob, modifyPromptForConcept } from './services/geminiService';
import type { GeneratedImage, UploadedImage, Prompt } from './types';
import { ImageStatus } from './types';
import { UploadCloudIcon, GalleryIcon, RetryIcon, PlusCircleIcon, XIcon } from './components/Icons';
import ImageCard from './components/ImageCard';
import Modal from './components/Modal';
import { useTranslations } from './context/LanguageContext';
import type { Language } from './context/LanguageContext';

type ShotType = 'upper' | 'full' | 'face' | 'random';
type StyleOption = 'mix' | 'professional' | 'casual' | 'high-fashion';
type Gender = 'female' | 'male';

const ControlPanel: React.FC<{
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAddPhoto: () => void;
    onRemoveImage: (index: number) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onGenerate: () => void;
    onRetryFailed: () => void;
    uploadedImages: UploadedImage[];
    isGenerating: boolean;
    hasFailedImages: boolean;
    shotType: ShotType;
    onShotTypeChange: (type: ShotType) => void;
    styleOption: StyleOption;
    onStyleOptionChange: (option: StyleOption) => void;
    gender: Gender;
    onGenderChange: (gender: Gender) => void;
    jobTitle: string;
    onJobTitleChange: (job: string) => void;
    concept: string;
    onConceptChange: (concept: string) => void;
}> = ({ onFileSelect, onAddPhoto, onRemoveImage, fileInputRef, onGenerate, onRetryFailed, uploadedImages, isGenerating, hasFailedImages, shotType, onShotTypeChange, styleOption, onStyleOptionChange, gender, onGenderChange, jobTitle, onJobTitleChange, concept, onConceptChange }) => {
    const { t, language, setLanguage } = useTranslations();
    
    const hasUploadedImages = uploadedImages.length > 0;

    return (
        <section className="w-full lg:w-[400px] lg:h-screen lg:flex-shrink-0 bg-[#1a1a1a] p-6 flex flex-col text-gray-300 lg:border-r border-b lg:border-b-0 border-gray-700/50">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t.appTitle}</h1>
                    <p className="text-sm text-gray-400 mt-1">{t.appSubtitle}</p>
                </div>
                <div className="relative">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="bg-gray-800 border border-gray-700 text-white text-sm rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer"
                        aria-label="Select language"
                    >
                        <option value="ko">🇰🇷 한국어</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="ja">🇯🇵 日本語</option>
                    </select>
                </div>
            </div>
            
            <div className="lg:flex-grow lg:overflow-y-auto lg:pr-2 space-y-8">
                <div>
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center mr-2">1</span>
                        {t.uploadPhoto}
                    </h2>
                    <p className="text-xs text-gray-500 mb-3">{t.multiUploadTip}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {uploadedImages.map((image, index) => (
                            <div key={image.objectUrl} className="relative group aspect-square">
                                <img src={image.objectUrl} alt={`Uploaded ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                                <button 
                                    onClick={() => onRemoveImage(index)} 
                                    className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity"
                                    aria-label={t.removeImage}
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {uploadedImages.length < 4 && (
                            <div 
                                onClick={onAddPhoto} 
                                className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-gray-800/50 transition-colors ${uploadedImages.length === 0 ? 'col-span-2' : ''}`}
                            >
                                <UploadCloudIcon className="w-8 h-8 text-gray-500 mb-2"/>
                                <span className="text-gray-400 text-sm text-center font-medium px-1">{t.addPhoto}</span>
                            </div>
                        )}
                    </div>
                    <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={onFileSelect} ref={fileInputRef} />
                    <p className="text-xs text-gray-500 mt-2 text-center">{t.uploadTip}</p>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center mr-2">2</span>
                        {t.generationOptions}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-2">{t.gender}</h3>
                            <div className="flex space-x-2 rounded-lg bg-gray-800 p-1">
                                <button onClick={() => onGenderChange('female')} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${gender === 'female' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.female}</button>
                                <button onClick={() => onGenderChange('male')} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${gender === 'male' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.male}</button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-2">{t.shotRange}</h3>
                            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-800 p-1">
                                <button onClick={() => onShotTypeChange('face')} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${shotType === 'face' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.faceFocused}</button>
                                <button onClick={() => onShotTypeChange('upper')} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${shotType === 'upper' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.upperBody}</button>
                                <button onClick={() => onShotTypeChange('full')} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${shotType === 'full' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.fullBody}</button>
                                <button onClick={() => onShotTypeChange('random')} className={`w-full rounded-md py-2 text-sm font-medium transition-colors ${shotType === 'random' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.random}</button>
                            </div>
                        </div>
                         <div>
                            <h3 className="text-sm font-medium text-gray-400 mb-2">{t.styleSelection}</h3>
                            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-800 p-1">
                                <button onClick={() => onStyleOptionChange('mix')} className={`w-full rounded-md py-2 text-xs font-medium transition-colors ${styleOption === 'mix' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.styleMix}</button>
                                <button onClick={() => onStyleOptionChange('professional')} className={`w-full rounded-md py-2 text-xs font-medium transition-colors ${styleOption === 'professional' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.styleProfessional}</button>
                                <button onClick={() => onStyleOptionChange('casual')} className={`w-full rounded-md py-2 text-xs font-medium transition-colors ${styleOption === 'casual' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.styleCasual}</button>
                                 <button onClick={() => onStyleOptionChange('high-fashion')} className={`w-full rounded-md py-2 text-xs font-medium transition-colors ${styleOption === 'high-fashion' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{t.styleHighFashion}</button>
                            </div>
                        </div>
                    </div>
                </div>

                 <div>
                    <details className="group">
                        <summary className="text-base font-semibold text-white mb-3 flex items-center justify-between cursor-pointer list-none -mx-2 px-2 py-1 rounded-md hover:bg-gray-700/50">
                            <span>{t.advancedSettings}</span>
                            <svg className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </summary>
                        <div className="mt-2 pl-2 space-y-4">
                            <div>
                                <label htmlFor="job-title" className="text-sm font-medium text-gray-400 mb-2 block">{t.job}</label>
                                <input 
                                    id="job-title"
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => onJobTitleChange(e.target.value)}
                                    placeholder={t.jobPlaceholder}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                                <p className="text-xs text-gray-500 mt-2">{t.jobDescription}</p>
                            </div>
                             <div>
                                <label htmlFor="concept-object" className="text-sm font-medium text-gray-400 mb-2 block">{t.conceptObject}</label>
                                <input 
                                    id="concept-object"
                                    type="text"
                                    value={concept}
                                    onChange={(e) => onConceptChange(e.target.value)}
                                    placeholder={t.conceptPlaceholder}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                />
                                <p className="text-xs text-gray-500 mt-2">{t.conceptDescription}</p>
                            </div>
                        </div>
                    </details>
                </div>

                <div>
                     <h2 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <span className="bg-indigo-600 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center mr-2">3</span>
                        {t.generateProfilePictures}
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">{t.generateDescription}</p>
                    <button 
                        onClick={onGenerate} 
                        disabled={!hasUploadedImages || isGenerating}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                    >
                        {isGenerating ? t.generating : t.startGeneration}
                    </button>
                     <p className="text-xs text-gray-500 mt-2 text-center">{t.retryTip}</p>
                     <p className="text-xs text-gray-500 mt-2 text-center">{t.usageLimit}</p>
                     <p className="text-xs text-gray-500 mt-2 text-center">
                        <a href="https://www.threads.com/@choi.openai" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{t.followMe}</a>
                     </p>
                    {hasFailedImages && !isGenerating && (
                        <button
                            onClick={onRetryFailed}
                            className="w-full mt-4 bg-yellow-600 text-white font-bold py-3 px-4 rounded-md hover:bg-yellow-500 transition-all flex items-center justify-center space-x-2"
                        >
                            <RetryIcon />
                            <span>{t.retryFailed}</span>
                        </button>
                    )}
                </div>
                 {isGenerating && (
                    <div className="text-center text-sm text-yellow-400 p-3 bg-yellow-900/50 rounded-lg">
                        <p>{t.generatingWaitMessage}</p>
                    </div>
                )}
            </div>
        </section>
    );
}

const App: React.FC = () => {
    const { t } = useTranslations();
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);
    const [selectedImageForModal, setSelectedImageForModal] = useState<GeneratedImage | null>(null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    const [shotType, setShotType] = useState<ShotType>('upper');
    const [styleOption, setStyleOption] = useState<StyleOption>('professional');
    const [gender, setGender] = useState<Gender>('female');
    const [jobTitle, setJobTitle] = useState<string>('');
    const [concept, setConcept] = useState<string>('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddPhoto = () => {
        if (uploadedImages.length < 4) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file && uploadedImages.length < 4) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const [header, base64Data] = result.split(',');
                const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
                
                const newImage: UploadedImage = {
                    base64: base64Data,
                    mimeType: mimeType,
                    objectUrl: URL.createObjectURL(file),
                };
                setUploadedImages(prev => [...prev, newImage]);
            };
            reader.readAsDataURL(file);
        }

        if (event.target) {
            event.target.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        const imageToRemove = uploadedImages[index];
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.objectUrl);
        }
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const getModifiedPrompt = useCallback((prompt: string) => {
        let currentShotType = shotType;
        if (shotType === 'random') {
            const options: Exclude<ShotType, 'random'>[] = ['face', 'upper', 'full'];
            currentShotType = options[Math.floor(Math.random() * options.length)];
        }

        let shotTypeString = '';
        switch (currentShotType) {
            case 'upper':
                shotTypeString = 'An upper body shot.';
                break;
            case 'full':
                shotTypeString = 'A full body shot.';
                break;
            case 'face':
                shotTypeString = 'A close-up portrait shot, focusing sharply on the face, its expression, and details.';
                break;
        }
        return `${prompt} ${shotTypeString}`;
    }, [shotType]);
    
    const generateSingleImage = useCallback(async (baseImgs: UploadedImage[], imageToGenerate: GeneratedImage) => {
        setGeneratedImages((prev) => prev.map((img) =>
            img.id === imageToGenerate.id ? { ...img, status: ImageStatus.GENERATING } : img
        ));

        try {
            const modifiedPrompt = getModifiedPrompt(imageToGenerate.prompt);
            const newImageBase64 = await generateStudioImage(baseImgs, modifiedPrompt);
            const imageUrl = `data:image/png;base64,${newImageBase64}`;
            setGeneratedImages((prev) => prev.map((img) =>
                img.id === imageToGenerate.id ? { ...img, src: imageUrl, status: ImageStatus.SUCCESS } : img
            ));
        } catch (error) {
            console.error(`Failed to generate image for prompt: ${imageToGenerate.prompt}`, error);
            setGeneratedImages((prev) => prev.map((img) =>
                img.id === imageToGenerate.id ? { ...img, status: ImageStatus.ERROR } : img
            ));
        }
    }, [getModifiedPrompt]);

    const shuffleArray = <T,>(array: T[]): T[] => {
        return [...array].sort(() => Math.random() - 0.5);
    };

    const anyGenerationInProgress = isGenerating || isGeneratingMore;
    const validUploadedImages = uploadedImages;

    const handleGenerateClick = useCallback(async () => {
        if (validUploadedImages.length === 0 || anyGenerationInProgress) return;

        setIsGenerating(true);
        
        const genderFilteredPrompts = STUDIO_PROMPTS.filter(p => p.gender === gender || p.gender === 'unisex');
        const professionalPrompts = genderFilteredPrompts.filter(p => p.category === 'professional');
        const casualPrompts = genderFilteredPrompts.filter(p => p.category === 'casual');
        const highFashionPrompts = genderFilteredPrompts.filter(p => p.category === 'high-fashion');


        let selectedPrompts: Prompt[] = [];
        if (styleOption === 'mix') {
            selectedPrompts = [
                ...shuffleArray(professionalPrompts).slice(0, 7),
                ...shuffleArray(casualPrompts).slice(0, 7),
                ...shuffleArray(highFashionPrompts).slice(0, 6),
            ];
        } else if (styleOption === 'professional') {
            selectedPrompts = shuffleArray(professionalPrompts).slice(0, 20);
        } else if (styleOption === 'casual') {
            selectedPrompts = shuffleArray(casualPrompts).slice(0, 20);
        } else { // high-fashion
            selectedPrompts = shuffleArray(highFashionPrompts).slice(0, 20);
        }

        if (jobTitle.trim()) {
            const modificationPromises = selectedPrompts.map(p => modifyPromptForJob(p.text, jobTitle.trim()));
            const modifiedTexts = await Promise.all(modificationPromises);
            selectedPrompts = selectedPrompts.map((p, i) => ({ ...p, text: modifiedTexts[i] }));
        }

        if (concept.trim()) {
            const modificationPromises = selectedPrompts.map(p => modifyPromptForConcept(p.text, concept.trim()));
            const modifiedTexts = await Promise.all(modificationPromises);
            selectedPrompts = selectedPrompts.map((p, i) => ({ ...p, text: modifiedTexts[i] }));
        }

        const initialImages = shuffleArray(selectedPrompts).map((prompt, i) => ({
            id: i,
            prompt: prompt.text,
            src: null,
            status: ImageStatus.PENDING,
            category: prompt.category,
        }));
        setGeneratedImages(initialImages);

        const generationPromises = initialImages.map(image => generateSingleImage(validUploadedImages, image));
        await Promise.all(generationPromises);
        setIsGenerating(false);
    }, [validUploadedImages, styleOption, gender, jobTitle, concept, anyGenerationInProgress, generateSingleImage]);

    const handleGetMoreClick = useCallback(async () => {
        if (validUploadedImages.length === 0 || anyGenerationInProgress) return;

        setIsGenerating(true);

        const usedPrompts = new Set(generatedImages.map(img => img.prompt));
        
        const genderFilteredPrompts = STUDIO_PROMPTS.filter(p => p.gender === gender || p.gender === 'unisex');
        const availableProfessional = genderFilteredPrompts.filter(p => p.category === 'professional' && !usedPrompts.has(p.text));
        const availableCasual = genderFilteredPrompts.filter(p => p.category === 'casual' && !usedPrompts.has(p.text));
        const availableHighFashion = genderFilteredPrompts.filter(p => p.category === 'high-fashion' && !usedPrompts.has(p.text));

        let additionalPrompts: Prompt[] = [];
        if (styleOption === 'mix') {
            additionalPrompts = [
                ...shuffleArray(availableProfessional).slice(0, 4),
                ...shuffleArray(availableCasual).slice(0, 3),
                ...shuffleArray(availableHighFashion).slice(0, 3),
            ];
        } else if (styleOption === 'professional') {
            additionalPrompts = shuffleArray(availableProfessional).slice(0, 10);
        } else if (styleOption === 'casual') {
            additionalPrompts = shuffleArray(availableCasual).slice(0, 10);
        } else { // high-fashion
            additionalPrompts = shuffleArray(availableHighFashion).slice(0, 10);
        }

        if (additionalPrompts.length === 0) {
            alert(t.noMoreStyles);
            setIsGenerating(false);
            return;
        }

        if (jobTitle.trim()) {
            const modificationPromises = additionalPrompts.map(p => modifyPromptForJob(p.text, jobTitle.trim()));
            const modifiedTexts = await Promise.all(modificationPromises);
            additionalPrompts = additionalPrompts.map((p, i) => ({ ...p, text: modifiedTexts[i] }));
        }

        if (concept.trim()) {
            const modificationPromises = additionalPrompts.map(p => modifyPromptForConcept(p.text, concept.trim()));
            const modifiedTexts = await Promise.all(modificationPromises);
            additionalPrompts = additionalPrompts.map((p, i) => ({ ...p, text: modifiedTexts[i] }));
        }

        const newImages = shuffleArray(additionalPrompts).map((prompt, i) => ({
            id: generatedImages.length + i,
            prompt: prompt.text,
            src: null,
            status: ImageStatus.PENDING,
            category: prompt.category,
        }));
        
        setGeneratedImages(prev => [...prev, ...newImages]);

        const generationPromises = newImages.map(image => generateSingleImage(validUploadedImages, image));
        await Promise.all(generationPromises);
        setIsGenerating(false);
    }, [validUploadedImages, generatedImages, anyGenerationInProgress, styleOption, gender, jobTitle, concept, generateSingleImage, t.noMoreStyles]);

    const handleRetryFailedClick = useCallback(async () => {
        const failedImages = generatedImages.filter(img => img.status === ImageStatus.ERROR);
        if (failedImages.length === 0 || validUploadedImages.length === 0 || anyGenerationInProgress) return;

        setIsGenerating(true);
        const retryPromises = failedImages.map(image => generateSingleImage(validUploadedImages, image));
        await Promise.all(retryPromises);
        setIsGenerating(false);
    }, [validUploadedImages, generatedImages, anyGenerationInProgress, generateSingleImage]);

    const handleRetryOneImage = useCallback(async (imageId: number) => {
        const imageToRetry = generatedImages.find(img => img.id === imageId);
        if (!imageToRetry || validUploadedImages.length === 0 || anyGenerationInProgress) return;
        
        await generateSingleImage(validUploadedImages, imageToRetry);
    }, [validUploadedImages, generatedImages, anyGenerationInProgress, generateSingleImage]);
    
    const handleCreateMore = useCallback(async (sourceImage: GeneratedImage) => {
        if (!sourceImage.src || validUploadedImages.length === 0 || anyGenerationInProgress) return;

        setIsGeneratingMore(true);
        setSelectedImageForModal(null);

        const newImagePlaceholders = Array.from({ length: 5 }).map((_, i) => ({
            id: generatedImages.length + i,
            prompt: t.thinkingOfNewStyles,
            src: null,
            status: ImageStatus.GENERATING, // Show spinner immediately
            category: sourceImage.category,
        }));
        setGeneratedImages(prev => [...prev, ...newImagePlaceholders]);

        try {
            let newPrompts = await generateNewPrompts(sourceImage.prompt);

            if (jobTitle.trim()) {
                const modificationPromises = newPrompts.map(p => modifyPromptForJob(p, jobTitle.trim()));
                newPrompts = await Promise.all(modificationPromises);
            }

            if (concept.trim()) {
                const modificationPromises = newPrompts.map(p => modifyPromptForConcept(p, concept.trim()));
                newPrompts = await Promise.all(modificationPromises);
            }

            const imagesToGenerate = newImagePlaceholders.map((placeholder, i) => ({
                ...placeholder,
                prompt: newPrompts[i] || sourceImage.prompt, // Use new prompt, fallback to original
            }));

            // Update prompts in state so the modal can show the correct one later
            setGeneratedImages(prev => prev.map(img => {
                const match = imagesToGenerate.find(g => g.id === img.id);
                return match ? match : img;
            }));

            const generationPromises = imagesToGenerate.map(img => generateSingleImage(validUploadedImages, img));
            await Promise.all(generationPromises);

        } catch (error) {
            console.error("Failed to create more images:", error);
            alert(t.failedToCreateMore);
            setGeneratedImages(prev => prev.map(img => 
                newImagePlaceholders.some(p => p.id === img.id) ? { ...img, status: ImageStatus.ERROR } : img
            ));
        } finally {
            setIsGeneratingMore(false);
        }

    }, [generatedImages, validUploadedImages, jobTitle, concept, anyGenerationInProgress, generateSingleImage, t.thinkingOfNewStyles, t.failedToCreateMore]);
    
    const handleCreateVideo = useCallback(async () => {
        if (!selectedImageForModal?.src || isGeneratingVideo || anyGenerationInProgress) return;

        setIsGeneratingVideo(true);
        setGeneratedVideoUrl(null);

        try {
            const [header, base64Data] = selectedImageForModal.src.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
            const sourceImage: UploadedImage = { base64: base64Data, mimeType, objectUrl: '' };
            const videoPrompt = "A short video of a model photoshoot, beginning with this still image. The model animates with very subtle, natural motions like a gentle turn of the head, a soft smile appearing, or eyes slowly blinking. The camera must stay fixed, maintaining the original composition and framing. The result should feel like a living photograph from a high-fashion magazine.";
            
            const videoUrl = await generateStudioVideo(sourceImage, videoPrompt);
            setGeneratedVideoUrl(videoUrl);

        } catch (error) {
            console.error("Failed to create video:", error);
            alert(t.failedToCreateVideo);
        } finally {
            setIsGeneratingVideo(false);
        }
    }, [selectedImageForModal, isGeneratingVideo, anyGenerationInProgress, t.failedToCreateVideo]);


    const hasFailedImages = generatedImages.some(img => img.status === ImageStatus.ERROR);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[#121212] text-white font-sans">
            <ControlPanel 
                onFileSelect={handleFileChange}
                onAddPhoto={handleAddPhoto}
                onRemoveImage={handleRemoveImage}
                fileInputRef={fileInputRef}
                onGenerate={handleGenerateClick}
                onRetryFailed={handleRetryFailedClick}
                uploadedImages={uploadedImages}
                isGenerating={anyGenerationInProgress}
                hasFailedImages={hasFailedImages}
                shotType={shotType}
                onShotTypeChange={setShotType}
                styleOption={styleOption}
                onStyleOptionChange={setStyleOption}
                gender={gender}
                onGenderChange={setGender}
                jobTitle={jobTitle}
                onJobTitleChange={setJobTitle}
                concept={concept}
                onConceptChange={setConcept}
            />
            <main className="flex-1 bg-[#1e1e1e] p-4 md:p-8 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-200">{t.gallery}</h2>
                </div>
                <div className="flex-1 lg:overflow-y-auto lg:pr-2">
                    {generatedImages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {generatedImages.map((image) => (
                               <ImageCard key={image.id} image={image} onView={setSelectedImageForModal} onRetry={handleRetryOneImage} />
                            ))}
                            {generatedImages.length > 0 && !anyGenerationInProgress && (
                                <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                                    <button
                                        onClick={handleGetMoreClick}
                                        className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                                        aria-label={t.generate10More}
                                    >
                                        <PlusCircleIcon className="w-12 h-12" />
                                        <span className="mt-2 font-semibold text-sm text-center px-2">{t.generate10More}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 border-2 border-dashed border-gray-700 rounded-xl p-4 text-center">
                            <GalleryIcon className="w-16 h-16 text-gray-600"/>
                            <h3 className="mt-4 text-lg font-semibold text-gray-400">{t.galleryEmpty}</h3>
                            <p className="mt-1 text-sm">{t.galleryEmptyInstructions}</p>
                        </div>
                    )}
                </div>
            </main>
            <Modal 
                isOpen={!!selectedImageForModal} 
                onClose={() => {
                    setSelectedImageForModal(null)
                    if(generatedVideoUrl) {
                        URL.revokeObjectURL(generatedVideoUrl);
                    }
                    setGeneratedVideoUrl(null)
                }} 
                image={selectedImageForModal}
                onCreateMore={handleCreateMore}
                isGeneratingMore={isGeneratingMore}
                onCreateVideo={handleCreateVideo}
                isGeneratingVideo={isGeneratingVideo}
                generatedVideoUrl={generatedVideoUrl}
             />
        </div>
    );
};

export default App;