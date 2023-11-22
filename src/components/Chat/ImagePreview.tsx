// ImagePreview.tsx
import { useState } from 'react';
import { Modal } from '@mantine/core';
import { montserrat_heading } from 'fonts'


interface ImagePreviewProps {
    src: string;
    alt?: string;
    className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, className }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <img
                src={src}
                alt={alt}
                onClick={() => setIsModalOpen(true)}
                style={{ cursor: 'pointer' }}
                className={className}
            />
            <Modal
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Image Preview`}
                size={'xxl'}
                closeOnEscape={true}
                transitionProps={{ transition: 'fade', duration: 200 }}
                centered
                radius={'lg'}
                overlayProps={{ blur: 3, opacity: 0.55 }}
                styles={{
                    header: {
                        backgroundColor: '#15162c',
                    },
                    body: {
                        backgroundColor: '#15162c',

                    },
                    title: {
                        color: 'white',
                        fontFamily: montserrat_heading.variable,
                        fontWeight: 'bold'
                    }
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <img src={src} alt={alt} />
                </div>
            </Modal>
        </>
    );
};