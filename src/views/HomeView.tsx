import { HOME_SECTIONS, type HomeSectionId } from "../data/stickers";

type HomeViewProps = {
    onNavigate: (sectionId: HomeSectionId) => void;
};

export function HomeView({ onNavigate }: HomeViewProps) {
    return (
        <section className="home-grid">
            <h2>Choose Sticker Sheets</h2>
            <p>Pick by bestseller picks or sheet size.</p>
            <div className="section-cards">
                {HOME_SECTIONS.map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        className="section-card"
                        onClick={() => onNavigate(section.id)}
                    >
                        <strong>{section.label}</strong>
                        <span>{section.description}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
