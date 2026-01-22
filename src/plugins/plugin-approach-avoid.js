import '../custom.css';
import stimuli from '../stimuli/norming-targets.json' with { type: 'json' }
import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { faEnvelope, faPhone, faArrowUpRightFromSquare, faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
library.add(faEnvelope, faPhone, faArrowUpRightFromSquare, faCircleCheck, faCircleXmark);
dom.watch();

var jsPsychApproachAvoidTaskPlugin = (function() {

  // --- STIMULUS DATA (External JSON import) ---
  // const morallyBadStimuli = stimuli['bad']
  // morallyBadStimuli = parsed.map(item => item.description);
  // const morallyGoodStimuli = stimuli['good']
  
  
  // const morallyGoodStimuli = stimuli.filter(item => item.morality === 'good').map(item => item.description);

  // console.log(morallyBadStimuli)

  // --- STIMULUS DATA (Internal to the plugin) ---
  // const moralGood = [stimuli.good['']];
  // console.log(moralGood)

  // const moralBad = [stimuli.bad['Beverley Allitt']];

  // --- INFO OBJECT DEFINITION ---
  const info = {
    name: "plugin-jspsych-approach-avoid-task",
    parameters: {
      // NOTE: Using a placeholder type as jsPsych is not globally available here. 
      // This works in many modern build pipelines, but use jsPsych.plugins.parameterType
      // if you move this object definition inside the constructor.
      sub_trials: {
        pretty_name: 'Sub-trials',
        default: [],
        array: true,
        description: 'Array of objects containing sub-trial stimuli, e.g., [{stimulus_text: "..."}]'
      },
      continue_button_text: { 
        pretty_name: 'Continue button text',
        default: ["yes", "no"], 
        array: true
      },
      // Keeping other unused parameters for compatibility, but they are ignored by the current logic
      num_cards: { default: 32 },
    }
  };
  
  // --- PLUGIN CONSTRUCTOR ---
  function jsPsychApproachAvoidTaskPlugin(jsPsych) {
    this.jsPsych = jsPsych;
  }

  // --- TRIAL FUNCTION ---
  jsPsychApproachAvoidTaskPlugin.prototype.trial = function(display_element, trial) {
    
    // 1. INITIALIZATION
    let current_trial_index = 0;
    let trial_start_time = performance.now(); // Start time for current card presentation
    let trial_data_collection = [];
    
    // 2. STIMULUS PREPARATION (Creates the card deck)
    if (!trial.sub_trials || trial.sub_trials.length === 0) {
        const all_stimuli = [];
        const num_trials_needed = trial.num_cards; 
        
        for (let i = 0; i < num_trials_needed; i++) {
            const is_good = (i % 2 === 0);
            const stimulus_source = is_good ? moralGood : moralBad;
            
            // Gets the single stimulus from the array
            const text_content = stimulus_source[0]; 
            
            all_stimuli.push({
                stimulus_text: text_content,
                category: is_good ? 'good' : 'bad'
            });
        }
        
        // Shuffle the array using the jsPsych instance
        trial.sub_trials = this.jsPsych.randomization.shuffle(all_stimuli); 
    }
    
    // 3. BUILD HTML (The entire stack of cards)
    var html = `
      <div id="aat-experiment-wrapper">
        ${trial.sub_trials.map((sub_trial, index) => `
          <div class="aat-parent-container aat-card" data-trial-index="${index}">
            <div class="aat-stimulus-container">
              <p class="faded-text">${sub_trial.stimulus_text}</p>
            </div>
            <p>
              <strong>${trial.prompt_text}</strong>
            </p>
            <div class="aat-button-container">
              <button class="aat-button aat-button-yes" id="aat-button-yes" data-response="${trial.button_1}">
                <span class="front">
                  <i class="fa fa-circle-check"></i>&nbsp;${trial.continue_button_text[0]}
                </span>
              </button>
              <button class="aat-button aat-button-no" id="aat-button-no" data-response="${trial.button_2}">
                <span class="front">
                  <i class="fa fa-circle-xmark"></i>&nbsp;${trial.continue_button_text[1]}
                </span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    display_element.innerHTML = html;

    // 4. GET ELEMENTS AND ACTIVATE FIRST CARD
    const all_cards = display_element.querySelectorAll('.aat-card');
    const total_trials = all_cards.length;

    if (total_trials > 0) {
        all_cards[0].classList.add('active');
        trial_start_time = performance.now(); // Start RT clock for the first card
    }

    // 5. CORE FUNCTIONS (Card transition and data handling)
    
    const next_card = (response_data) => {
        trial_data_collection.push(response_data);

        const active_card = all_cards[current_trial_index];
        
        // Trigger the EXIT animation
        active_card.classList.remove('active');

        if (response_data.response === 'yes') {
          active_card.classList.add('exit');
        } else {
          active_card.classList.add('hide');
        }
        
        current_trial_index++;
        
        if (current_trial_index < total_trials) {
            const next_card_el = all_cards[current_trial_index];
            
            next_card_el.classList.add('next-in');
            
            // Wait for exit animation (400ms)
            setTimeout(() => {
                // Trigger the entrance of the NEXT card
                next_card_el.classList.remove('next-in');
                next_card_el.classList.add('active'); 
                
                // Reset start time for the NEW card
                trial_start_time = performance.now();
            }, 400); 

        } else {
            // All trials complete: End the plugin trial
            setTimeout(() => {
                this.jsPsych.finishTrial({
                    all_sub_trial_data: trial_data_collection
                });
            }, 400); 
        }
    };

    // 6. BUTTON EVENT LISTENERS
    display_element.querySelectorAll('#aat-button-yes').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const click_time = performance.now();
            const clicked_card = e.target.closest('.aat-card');
            const faded_text = clicked_card.querySelector('.faded-text');
            
            // Disable buttons during the animation period
            clicked_card.querySelectorAll('.aat-response-btn').forEach(b => b.disabled = true);
            
            // Trigger the UNBLUR animation
            faded_text.classList.remove('faded-text');
            
            const response_choice = e.target.dataset.response; 
            const rt = click_time - trial_start_time; 
            
            // Wait for UNBLUR transition (500ms)
            setTimeout(() => {
                const response_data = {
                    sub_trial_index: current_trial_index,
                    stimulus: faded_text.textContent,
                    response: response_choice,
                    rt: rt,
                    category: trial.sub_trials[current_trial_index].category
                };
                
                next_card(response_data);
            }, trial.trial_duration_seconds * 1000); 
        });
    });

    display_element.querySelectorAll('#aat-button-no').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const click_time = performance.now();
            const clicked_card = e.target.closest('.aat-card');
            // const faded_text = clicked_card.querySelector('.faded-text');
            
            // Disable buttons during the animation period
            clicked_card.querySelectorAll('.aat-response-btn').forEach(b => b.disabled = true);
            
            // Trigger the UNBLUR animation
            // faded_text.classList.remove('faded-text');
            
            const response_choice = e.target.dataset.response; 
            const rt = click_time - trial_start_time; 
            
            // Wait for UNBLUR transition (500ms)
            setTimeout(() => {
                const response_data = {
                    sub_trial_index: current_trial_index,
                    // stimulus: faded_text.textContent,
                    response: response_choice,
                    rt: rt,
                    category: trial.sub_trials[current_trial_index].category
                };
                
                next_card(response_data);
            }, 300); 
        });
    });
  };

  // --- ATTACH INFO AND RETURN ---
  jsPsychApproachAvoidTaskPlugin.info = info;

  return jsPsychApproachAvoidTaskPlugin;  
})();
export { jsPsychApproachAvoidTaskPlugin };