import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

const info = <const>{
  name: "wylab-survey",
  version: "1.0.0",
  parameters: {
    custom_html: { type: ParameterType.BOOL, default: false },
    preamble: { type: ParameterType.HTML_STRING, default: null },
    button_label: { type: ParameterType.STRING, default: "Next Page" },
    randomize_question_order: { type: ParameterType.BOOL, default: false },
    autofocus: { type: ParameterType.STRING, default: "" },
    dataAsArray: { type: ParameterType.BOOL, default: false },
    autocomplete: { type: ParameterType.BOOL, default: false },
    
    // Define the nested subparameters here
    questions: {
      type: ParameterType.COMPLEX,
      array: true,
      pretty_name: "Questions",
      default: [],
      nested: {
        prompt: {
          type: ParameterType.HTML_STRING,
          pretty_name: "Prompt",
          default: null,
        },
        name: {
          type: ParameterType.STRING,
          pretty_name: "Question Name",
          default: "",
        },
        options: {
          type: ParameterType.STRING,
          pretty_name: "Options",
          array: true,
          default: [],
        },
        
        format: {
          type: ParameterType.COMPLEX,
          default: {},
          nested: {
            type: { type: ParameterType.STRING, default: "radio" }, // 'radio', 'slider', etc.
            
            // Multiple Choice
            mc_orientation: { type: ParameterType.STRING, default: "vertical" },
            
            // Slider
            slider_direction: { type: ParameterType.STRING, default: "unipolar" },
            slider_color_scheme: { type: ParameterType.STRING, default: "purple" },
            slider_starting_value: { type: ParameterType.INT, default: 0 },
            slider_anchors: {
              type: ParameterType.COMPLEX,
              default: { left: "", right: "", center: "" },
              nested: {
                left: { type: ParameterType.STRING, default: "" },
                center: { type: ParameterType.STRING, default: "" },
                right: { type: ParameterType.STRING, default: "" },
              }
            },
            slider_range: { type: ParameterType.INT, array: true, default: [0, 100] },
            
            // Number Input
            number_min: { type: ParameterType.INT, default: 0 },
            number_max: { type: ParameterType.INT, default: 100 },
            number_step: { type: ParameterType.INT, default: 1 },

            // Long Text Input
            essay_rows: { type: ParameterType.INT, default: 5 },
            essay_cols: { type: ParameterType.INT, default: 40 },
            essay_max_length: { type: ParameterType.INT, default: null },
            essay_placeholder: { type: ParameterType.STRING, default: "" },
            
            // Short Text Input
            short_text_max_length: { type: ParameterType.INT, default: null },
            short_text_placeholder: { type: ParameterType.STRING, default: "" }
            
          }
        },
        requirements: {
          type: ParameterType.COMPLEX,
          default: {},
          nested: {
            type: { type: ParameterType.STRING, default: "none" }, // 'none, 'request', 'required', 'comprehension'
            correct_answer: { type: ParameterType.HTML_STRING, default: null },
            explanation: { type: ParameterType.HTML_STRING, default: "" }  // TODO: HTML vs non-html
          }
        },
        write_in: {
          type: ParameterType.STRING,
          pretty_name: "Write-in Options",
          array: true,
          default: [],
        },
      },
    },
  },
  data: {
    response: { type: ParameterType.OBJECT },
    rt: { type: ParameterType.INT },
  },
};

type Info = typeof info;

class WyLabSurveyPlugin implements JsPsychPlugin<Info> {
  static info = info;
  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    const checkPath = "M17.8062 7.37181C18.0841 7.67897 18.0603 8.15325 17.7532 8.43115L9.8782 15.5562C9.59605 15.8114 9.16747 15.815 8.88113 15.5644L5.88113 12.9394C5.5694 12.6667 5.53782 12.1928 5.81058 11.8811C6.08334 11.5694 6.55716 11.5378 6.86889 11.8106L9.36667 13.9961L16.7468 7.31885C17.054 7.04094 17.5283 7.06466 17.8062 7.37181Z";
    const xPath = "M14.5,12l2.3,-2.3c0.4,-0.4,0.4,-1.1,0,-1.5l-0.8,-0.8c-0.4,-0.4,-1.1,-0.4,-1.5,0L12,9.7L9.7,7.4c-0.4,-0.4,-1.1,-0.4,-1.5,0L7.4,8.2c-0.4,0.4,-0.4,1.1,0,1.5L9.7,12l-2.3,2.3c-0.4,0.4,-0.4,1.1,0,1.5l0.8,0.8c0.4,0.4,1.1,0.4,1.5,0l2.3,-2.3l2.3,2.3c0.4,0.4,1.1,0.4,1.5,0l0.8,-0.8c0.4,-0.4,0.4,-1.1,0,-1.5L14.5,12z";
    const questions = trial.questions ?? [];
    let html = "";
    
    // 1. Build Preamble
    if (trial.preamble !== null) {
      html += `<div class="jspsych-survey-html-form-preamble">${trial.preamble}</div>`;
    }

    // 2. Start Form
    html += `<form class="jspsych-survey-html-form" autocomplete="${trial.autocomplete ? 'on' : 'off'}">`;

    if (trial.custom_html) {
      html += trial.custom_html;
    } else {

      // 3. Generate Questions
      let question_order = Array.from(questions.keys());
      if (trial.randomize_question_order) {
        question_order = this.jsPsych.randomization.shuffle(question_order);
      }

      for (let question_idx = 0; question_idx < question_order.length; question_idx++) {
        const question = questions[question_order[question_idx] as number];
        const question_id = `jspsych-survey-question-${question_idx}`;
        const question_name = question.name || question_id;
        const question_format = question.format?.type || 'short_response';
        const question_requirements = question.requirements?.type === 'required' ? 'required' : '';
        const question_prompt = question.prompt || "";
        
        html += `<fieldset class="jspsych-survey-html-form-question-${question.background ? 'minimal' : 'minimal'} incomplete" id="${question_id}">`;

        if (question_format === "slider") {
          const slider = question.format;
          const slider_direction = slider.slider_direction || 'bipolar';
          const slider_color_scheme = slider.slider_color_scheme || (slider_direction === 'unipolar' ? 'purple' : 'orange-purple');
          const slider_starting_value = slider.slider_starting_value !== undefined ? slider.slider_starting_value : (slider_direction === 'unipolar' ? slider.slider_range?.[0] || 0 : 0);
          const slider_range = slider.slider_range || [0, 100];
          const slider_step = slider.slider_step || 1;
          const slider_anchors = slider.slider_anchors || { left: "", right: "", center: "" }; 

          html += `
            <label class="jspsych-survey-html-form-prompt" for="slider-${question_id}">${question_prompt}</label>
            <input 
              id="slider-${question_id}"
              class="jspsych-slider"
              name="${question_name}" 
              type="range"
              value="${slider_starting_value}"
              data-starting-value="${slider_starting_value}"
              data-touched="false"
              ${question_requirements}
              min="${slider_range[0]}" max="${slider_range[1]}" step="${slider_step}" 
              onpointerdown="this.setAttribute('data-touched', 'true'); this.classList.add('${slider_direction}-clicked-${slider_color_scheme}');"
            >
            <div class="jspsych-slider-anchor-container">
              <span class="jspsych-slider-left-anchor">${slider_anchors.left}</span>
              <span class="jspsych-slider-center-anchor">${slider_anchors.center || ''}</span>
              <span class="jspsych-slider-right-anchor">${slider_anchors.right}</span>
            </div>`;

        // MULTIPLE CHOICE INPUT
        } else if (question_format === "radio" || question_format === "checkbox") {
          const mc = question.format;
          const mc_orientation = mc.mc_orientation || 'vertical';
          html += `<p class="jspsych-survey-html-form-prompt">${question_prompt}</p>`;
          html += `<div class="jspsych-survey-html-form-options-container-${mc_orientation}" role="${question_format}-group">`;
          
          for (let option_idx = 0; option_idx < question.options.length; option_idx++) {
            const option_id = `${question_id}-opt-${option_idx}`;
            html += `
              <label class="jspsych-survey-html-form-${question_format}-option-${mc_orientation}" for="${option_id}">
                <span class="${question_format}-button"></span>
                <input type="${question_format}" name="${question_name}" id="${option_id}" value="${question.options[option_idx]}" ${question_requirements}>
                <span class="${question_format}-button-label-${mc_orientation}">${question.options[option_idx]}</span>`;
            
            if (question.write_in && question.write_in.includes(question.options[option_idx])) {
              html += `<input type="text" name="${question_name}-writein" class="jspsych-survey-html-form-writein">`;
            }
            html += `</label>`;
          }
          html += `</div>`;
        }

        // NUMBER INPUT
        else if (question_format == "number") {
          // Attributes specific to numerical entry inputs:
          const number = question.format;
          const number_min = number.min || 0;
          const number_max = number.max || 100;
          const number_step = number.step || 1;

          html += `
            <label class="jspsych-survey-html-form-prompt" for="jspsych-survey-html-form-response-${question_id}">${question_prompt}</label>
            <input 
              id="jspsych-survey-html-form-response-${question_id}"
              class="jspsych-number-input" 
              name="${question_name}"
              type="number"
              min="${number_min}"
              max="${number_max}"
              step="${number_step}"
              ${question_requirements}>
          `;
        
        
          // SHORT TEXT INPUT
        } else if (question_format == "short_response") {
          const short_text = question.format;
          const short_text_max_length = short_text.max_length ? `maxlength="${short_text.max_length}"` : "";
          const short_text_placeholder = short_text.placeholder ? `placeholder="${short_text.placeholder}"` : "";
          html += `
            <label class="jspsych-survey-html-form-prompt" for="jspsych-survey-html-form-response-${question_id}">${question_prompt}</label>
            <input 
              id="jspsych-survey-html-form-response-${question_id}"
              class="jspsych-text-input" 
              name="${question_name}"
              type="text"
              ${short_text_max_length}
              ${short_text_placeholder}
              ${question_requirements}>
          `;

        // LONG TEXT INPUT
        } else if (question_format == "essay") {
          const essay = question.format;
          const essay_rows = essay.rows ? essay.rows : 5;
          const essay_cols = essay.cols ? essay.cols : 40;
          const essay_max_length = essay.max_length ? `maxlength="${essay.max_length}"` : "";
          const essay_placeholder = essay.placeholder ? `placeholder="${essay.placeholder}"` : "";

          html += `
            <label class="jspsych-survey-html-form-prompt" for="jspsych-survey-html-form-response-${question_id}">${question_prompt}</label>
            <textarea
              id="jspsych-survey-html-form-response-${question_id}"
              class="jspsych-textarea-input" 
              name="${question_name}"
              rows="${essay_rows}"
              cols="${essay_cols}" ${essay_max_length} ${essay_placeholder} ${question_requirements}></textarea>
          `;
        }
        if (question.requirements?.explanation) {
          html += `
            <div class="feedback-container" style="display:none; margin-top:10px; padding:10px; background:#f8f9fa; border-left:4px solid #6c757d;">
              <p style="margin:0; font-size:0.9em;"><strong>Explanation:</strong> ${question.requirements.explanation}</p>
            </div>`;
        }
        html += "</fieldset>";
      }
    }

    // 4. Modal HTML
    html += `
      <div id="jspsych-survey-overlay"></div>
      <div id="jspsych-confirm-popup">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div class="warning-icon">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2>Are you sure?</h2>
        </div>
          <p style="text-align: center;">There is at least one unanswered question.<br>Would you like to continue?</p>
          <button type="button" id="confirm-yes" class="jspsych-survey-html-form-next jspsych-btn" style="margin-right:10px;">Answer Question(s)</button>
          <button type="button" id="confirm-no" class="jspsych-btn">Continue Without Answering</button>
      </div>`;

    // 5. Submit Button
    html += `
      <div style="display: flex; justify-content: right; margin-top: 20px;">
        <button type="button" id="check-answers-btn" class="jspsych-btn">Check Answers</button>
        <button type="submit" id="next-btn" class="jspsych-survey-html-form-next jspsych-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
          ${trial.button_label}<i class="fa-solid fa-arrow-right-to-bracket fa-sm bounce-right-hover" style="margin-left: 5px;"></i>
        </button>
      </div>
    </form>`;


    // 6. SINGLE INJECTION POINT
    display_element.innerHTML = html;
    
    $(document).ready(function() {
        $('html, body').scrollTop(0);
    });

    if (!trial.custom_html) {
      // --- START POST-INJECTION LOGIC ---
      // Auto-select the radio/checkbox when the user types in a write-in field
      display_element.querySelectorAll<HTMLInputElement>('.jspsych-survey-html-form-writein').forEach(writein => {
        writein.addEventListener('input', () => {
          const parentLabel = writein.closest('label');
          const associatedInput = parentLabel?.querySelector('input') as HTMLInputElement;

          if (associatedInput && writein.value.trim() !== "") {
            // 1. Programmatically check the "Other" radio button
            associatedInput.checked = true;

            // 2. IF it's a radio button, remove 'selected' from all other options in this group
            if (associatedInput.type === 'radio') {
              const groupName = associatedInput.name;
              display_element.querySelectorAll(`input[name="${groupName}"]`).forEach(i => {
                i.closest('label')?.classList.remove('selected');
              });
            }

            // 3. Add 'selected' to the current "Other" label
            parentLabel?.classList.add('selected');

            // 4. Trigger validation so the 'incomplete' warning disappears
            associatedInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      });

      // Dynamic Horizontal Width
      const container = display_element.querySelector('.jspsych-survey-html-form-options-container-horizontal') as HTMLElement;
      if (container) {
        container.style.setProperty('--option-count', container.children.length.toString());
      }

      // Initialize Sliders
      display_element.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(s => {
        s.value = s.getAttribute('data-starting-value') || "50";
      });

      // 1. Handle Visual Checkmarks for Multiple Choice
      const svg_icon = '<span class="checkmark-svg"><svg height="1rem" viewBox="0 0 24 24" width="1rem" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M17.8062 7.37181C18.0841 7.67897 18.0603 8.15325 17.7532 8.43115L9.8782 15.5562C9.59605 15.8114 9.16747 15.815 8.88113 15.5644L5.88113 12.9394C5.5694 12.6667 5.53782 12.1928 5.81058 11.8811C6.08334 11.5694 6.55716 11.5378 6.86889 11.8106L9.36667 13.9961L16.7468 7.31885C17.054 7.04094 17.5283 7.06466 17.8062 7.37181Z"></path></svg></span>';
      display_element.querySelectorAll('.radio-button, .checkbox-button').forEach(btn => {
        btn.insertAdjacentHTML('beforeend', svg_icon);
      });

      // 2. Universal "Incomplete" Remover & Selection Highlighter
      display_element.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (!target) return;

        const fieldset = target.closest('fieldset');
        if (!fieldset) return;
        
        // 1. Logic for Number/Text/Textarea inputs
        const isTextInput = target.type === 'number' || target.type === 'text' || target.tagName === 'TEXTAREA';
        const isNotWriteIn = !target.classList.contains('jspsych-survey-html-form-writein');

        if (isTextInput && isNotWriteIn) {
          // If user has typed actual characters, remove 'incomplete'
          if (target.value.trim() !== "") {
            fieldset.classList.remove('incomplete');
          } else {
            fieldset.classList.add('incomplete');
          }
        }

        // 2. Logic for Multiple Choice (Including those with write-ins)
        if (target.type === 'radio' || target.type === 'checkbox') {
          // Selecting the bubble ALWAYS marks the question as complete, 
          // regardless of whether the write-in box is empty.
          fieldset.classList.remove('incomplete'); 
          
          const label = target.closest('label');
          if (target.type === 'radio') {
            display_element.querySelectorAll(`input[name="${target.name}"]`).forEach(i => {
              i.closest('label')?.classList.remove('selected');
            });
          }
          target.checked ? label?.classList.add('selected') : label?.classList.remove('selected');
        }
      });

      // 3. Special Case for Sliders (mousedown counts as interaction even if value doesn't change)
      display_element.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('mousedown', () => {
          slider.closest('fieldset')?.classList.remove('incomplete');
          slider.setAttribute('data-touched', 'true');
        });
      });
    }

    // Form Submission
    const form = display_element.querySelector(".jspsych-survey-html-form") as HTMLFormElement;
    let forceSubmit = false;
    const startTime = performance.now();


    // --- COMPREHENSION CHECK LOGIC ---
    const checkBtn = display_element.querySelector("#check-answers-btn") as HTMLButtonElement;
    const nextBtn = display_element.querySelector("#next-btn") as HTMLButtonElement;

    const hasComprehensionChecks = questions.some(q => q.requirements?.type === 'comprehension');

    if (!hasComprehensionChecks) {
      checkBtn.style.display = "none";
      nextBtn.disabled = false;
      nextBtn.style.opacity = "1";
      nextBtn.style.cursor = "pointer";
    }

    // Helper function to toggle the 'locked' state of questions
    function setQuestionsLocked(isLocked: boolean) {
      questions.forEach((q, index) => {
        if (q.requirements?.type === 'comprehension') {
          const fieldset = display_element.querySelector(`#jspsych-survey-question-${index}`) as HTMLElement;
          const inputs = fieldset.querySelectorAll('input, textarea');
          
          inputs.forEach((input: any) => {
            input.disabled = isLocked;
            // Optional: add a class for CSS styling of locked elements
            if (isLocked) {
              input.classList.add('locked-input');
            } else {
              input.classList.remove('locked-input');
            }
          });
        }
      });
    }



    checkBtn.addEventListener("click", () => {
      if (checkBtn.getAttribute("data-state") === "try-again") {
        resetComprehensionQuestions();
        setQuestionsLocked(false);
        return;
      }

      let allCorrect = true; // Start true
      const currentResponses = objectifyForm(serializeArray(form));

      setQuestionsLocked(true);

      questions.forEach((q, index) => {
        if (q.requirements?.type === 'comprehension') {
          const fieldset = display_element.querySelector(`#jspsych-survey-question-${index}`) as HTMLElement;
          const selectedLabel = fieldset.querySelector('label.selected');
          const svgPathElement = selectedLabel?.querySelector('svg path');
          
          const userVal = currentResponses[q.name || `jspsych-survey-question-${index}`];
          const isCorrect = String(userVal).trim().toLowerCase() === String(q.requirements.correct_answer).trim().toLowerCase();

          if (isCorrect) {
            fieldset.classList.replace("comprehension-check-fail", "comprehension-check-success") || fieldset.classList.add("comprehension-check-success");
            svgPathElement?.setAttribute("d", checkPath);
          } else {
            fieldset.classList.replace("comprehension-check-success", "comprehension-check-fail") || fieldset.classList.add("comprehension-check-fail");
            svgPathElement?.setAttribute("d", xPath);
            allCorrect = false; // If ANY question is wrong, this becomes false
          }

          const feedback = fieldset.querySelector(".feedback-container") as HTMLElement;
          if (feedback) feedback.style.display = "block";
        }
      });

      // Crucial: Only unlock if allCorrect is STILL true after the loop
      if (allCorrect) {
        checkBtn.style.display = "none";
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
        nextBtn.style.cursor = "pointer";
      } else {
        checkBtn.setAttribute("data-state", "try-again");
        checkBtn.innerHTML = 'Try Again <i class="fa-solid fa-rotate-right fa-sm" style="margin-left:5px;"></i>';
        
        // Ensure the next button stays locked if they failed
        nextBtn.disabled = true;
        nextBtn.style.opacity = "0.5";
        nextBtn.style.cursor = "not-allowed";
      }
    });

    // Helper function to reset the UI and Values
    function resetComprehensionQuestions() {
      questions.forEach((q, index) => {
        if (q.requirements?.type === 'comprehension') {
          const fieldset = display_element.querySelector(`#jspsych-survey-question-${index}`) as HTMLElement;
          
          // Reset the SVG path to the standard check
          fieldset.querySelectorAll('svg path').forEach(path => {
            path.setAttribute("d", checkPath);
          });
          
          // 1. Clear UI Classes
          fieldset.classList.remove("comprehension-check-success", "comprehension-check-fail");
          fieldset.classList.add("incomplete");
          
          // 2. Hide Feedback
          const feedback = fieldset.querySelector(".feedback-container") as HTMLElement;
          if (feedback) feedback.style.display = "none";

          // 3. Reset Inputs
          const inputs = fieldset.querySelectorAll('input, textarea');
          inputs.forEach((input: any) => {
            if (input.type === 'radio' || input.type === 'checkbox') {
              input.checked = false;
              input.closest('label')?.classList.remove('selected');
            } else if (input.type === 'range') {
              input.value = input.getAttribute('data-starting-value') || "50";
              input.setAttribute('data-touched', 'false');
            } else {
              input.value = "";
            }
          });
        }
      });

      // Reset button state
      checkBtn.setAttribute("data-state", "check");
      checkBtn.innerHTML = 'Check Answers';
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!trial.custom_html) {
        // 1. Identify questions that have been flagged as "request"
        const requestQuestions = questions.filter(q => q.requirements?.type === 'request');
        
        // 2. Check if any of those specific questions are still marked as "incomplete"
        const incompleteRequestQuestions = requestQuestions.filter((q, index) => {
          const fieldset = display_element.querySelector(`#jspsych-survey-question-${index}`);
          return fieldset?.classList.contains("incomplete");
        });

        // 3. Trigger the modal if a "request" question is missing a response
        if (incompleteRequestQuestions.length > 0 && !forceSubmit) {
          (display_element.querySelector("#jspsych-survey-overlay") as HTMLElement).style.display = "block";
          (display_element.querySelector("#jspsych-confirm-popup") as HTMLElement).style.display = "block";

          display_element.querySelector("#confirm-yes")?.addEventListener("click", () => {
            (display_element.querySelector("#jspsych-survey-overlay") as HTMLElement).style.display = "none";
            (display_element.querySelector("#jspsych-confirm-popup") as HTMLElement).style.display = "none";
          }, { once: true });

          display_element.querySelector("#confirm-no")?.addEventListener("click", () => {
            forceSubmit = true;
            form.dispatchEvent(new Event('submit'));
          }, { once: true });
          return;
        }

        // --- Final processing and finishing trial ---
        display_element.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(s => {
          if (s.getAttribute('data-touched') !== 'true') s.removeAttribute('name');
        });

        const raw_data = serializeArray(form);
        const final_data = trial.dataAsArray ? raw_data : objectifyForm(raw_data);

        if (!trial.dataAsArray) {
          questions.forEach((q: any) => { 
            if (!(q.name in final_data)) final_data[q.name] = null; 
          });
        }

        display_element.innerHTML = "";
        this.jsPsych.finishTrial({ 
          rt: Math.round(performance.now() - startTime), 
          response: final_data 
        });
      };
    });

    function serializeArray(f: HTMLFormElement) {
      const data: any[] = [];
      for (let i = 0; i < f.elements.length; i++) {
        const field = f.elements[i] as any;
        
        // Remove 'field.disabled' from this check so locked answers are still saved
        if (!field.name || ['submit', 'button'].includes(field.type)) continue;

        if ((field.type !== "checkbox" && field.type !== "radio") || field.checked) {
          if (field.value !== "" && field.value !== null) {
            data.push({ name: field.name, value: field.value });
          }
        }
      }
      return data;
    }

    function objectifyForm(arr: any[]) {
      const obj: any = {};
      arr.forEach(i => {
        if (i.name in obj) {
          obj[i.name] = Array.isArray(obj[i.name]) ? [...obj[i.name], i.value] : [obj[i.name], i.value];
        } else { obj[i.name] = i.value; }
      });
      return obj;
    }
  }
}

export default WyLabSurveyPlugin;