import React from 'react'

interface PageProps {
    pageId: string
}

export const Page: React.FC<PageProps> = ({ pageId }): React.JSX.Element => {
    return (
        <>
        {pageId}
        </>
    )
}
