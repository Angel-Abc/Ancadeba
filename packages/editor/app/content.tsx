import { ContentBar } from './contentBar'

export const Content: React.FC = (): React.JSX.Element => {
    return (
        <section className='main'>
            <ContentBar />
            <main className='content'>
            </main>
        </section>
    )
}
