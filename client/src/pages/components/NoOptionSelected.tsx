import dash1 from '/src/assets/images/dash1.png';

const NoOptionSelected = () => (
    <div className="no-option-message">
        <p>Select an option from the menu.</p>
        <img src={dash1} className="no-option-image" alt="dash1" />
    </div>
);

export default NoOptionSelected;
