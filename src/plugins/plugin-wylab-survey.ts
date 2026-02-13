import $ from "jquery";
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
    questions: {
      type: ParameterType.COMPLEX,
      array: true,
      pretty_name: "Questions",
      default: [],
      nested: {
        prompt: { type: ParameterType.HTML_STRING, default: null },
        name: { type: ParameterType.STRING, default: "" },
        background: { type: ParameterType.BOOL, default: false },
        format: {
          type: ParameterType.COMPLEX,
          default: {},
          nested: {
            type: { type: ParameterType.STRING, default: "radio" },
            mc_orientation: { type: ParameterType.STRING, default: "vertical" },
            options: { type: ParameterType.STRING, array: true, default: [] },
            write_in: { type: ParameterType.STRING, array: true, default: [] },
            labels: { type: ParameterType.STRING, array: true, default: [] },
            values: { type: ParameterType.STRING, array: true, default: [] },
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
            slider_step: { type: ParameterType.INT, default: 1 },
            number_min: { type: ParameterType.INT, default: 0 },
            number_max: { type: ParameterType.INT, default: 100 },
            number_step: { type: ParameterType.INT, default: 1 },
            essay_rows: { type: ParameterType.INT, default: 5 },
            essay_cols: { type: ParameterType.INT, default: 40 },
            essay_max_length: { type: ParameterType.INT, default: null },
            essay_placeholder: { type: ParameterType.STRING, default: "" },
            short_text_max_length: { type: ParameterType.INT, default: null },
            short_text_placeholder: { type: ParameterType.STRING, default: "" }
          }
        },
        requirements: {
          type: ParameterType.COMPLEX,
          default: {},
          nested: {
            type: { type: ParameterType.STRING, default: "none" },
            correct_answer: { type: ParameterType.HTML_STRING, default: null },
            explanation: { type: ParameterType.HTML_STRING, default: "" }
          }
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
    const questions = trial.questions ?? [];
    let html = "";

    $(function() { $('html, body').scrollTop(0); });
    
    if (trial.preamble !== null) {
      html += `<div class="jspsych-survey-html-form-preamble">${trial.preamble}</div>`;
    }

    html += `<form class="jspsych-survey-html-form" autocomplete="${trial.autocomplete ? 'on' : 'off'}">`;

    if (!trial.custom_html) {
      let question_order = Array.from(questions.keys());
      if (trial.randomize_question_order) {
        question_order = this.jsPsych.randomization.shuffle(question_order);
      }

      for (let question_idx = 0; question_idx < question_order.length; question_idx++) {
        const original_idx = question_order[question_idx] as number;
        const question = questions[original_idx];
        const question_id = `jspsych-survey-question-${original_idx}`;
        const question_name = question.name || question_id;
        const question_format = question.format?.type || 'short_response';
        const question_requirements = (question.requirements?.type === 'required' || question.requirements?.type === 'comprehension') ? 'required' : '';
        const question_prompt = question.prompt || "";
        
        html += `<fieldset class="jspsych-survey-html-form-question-minimal incomplete" id="${question_id}">`;

        if (question_format === "slider") {
            const slider = question.format;
            const slider_direction = slider.slider_direction || 'bipolar';
            const slider_color_scheme = slider.slider_color_scheme || (slider_direction === 'unipolar' ? 'purple' : 'orange-purple');
            const slider_starting_value = slider.slider_starting_value !== undefined ? slider.slider_starting_value : 50;
            const slider_range = slider.slider_range || [0, 100];
            const slider_step = slider.slider_step || 1;
            const slider_anchors = slider.slider_anchors || { left: "", right: "", center: "" }; 
  
            html += `
              <label class="jspsych-survey-html-form-prompt" for="slider-${question_id}">${question_prompt}</label>
              <input id="slider-${question_id}" class="jspsych-slider" name="${question_name}" type="range"
                value="${slider_starting_value}" data-starting-value="${slider_starting_value}" data-touched="false"
                min="${slider_range[0]}" max="${slider_range[1]}" step="${slider_step}" 
                onpointerdown="this.setAttribute('data-touched', 'true'); this.classList.add('${slider_direction}-clicked-${slider_color_scheme}');">
              <div class="jspsych-slider-anchor-container">
                <span class="jspsych-slider-left-anchor">${slider_anchors.left}</span>
                <span class="jspsych-slider-center-anchor">${slider_anchors.center || ''}</span>
                <span class="jspsych-slider-right-anchor">${slider_anchors.right}</span>
              </div>`;
  
        } else if (question_format === "radio" || question_format === "checkbox") {
          const mc = question.format;
          const mc_orientation = mc.mc_orientation || 'vertical';
          html += `<p class="jspsych-survey-html-form-prompt">${question_prompt}</p>`;
          html += `<div class="jspsych-survey-html-form-options-container-${mc_orientation}" role="${question_format}-group">`;
          
          for (let option_idx = 0; option_idx < mc.options.length; option_idx++) {
            const option_id = `${question_id}-opt-${option_idx}`;
            html += `
              <label class="jspsych-survey-html-form-${question_format}-option-${mc_orientation}" for="${option_id}">
                <span class="${question_format}-button"></span>
                <input type="${question_format}" name="${question_name}" id="${option_id}" value="${mc.values[option_idx]}" ${question_requirements}>
                <span class="${question_format}-button-label-${mc_orientation}">${mc.options[option_idx]}</span>`;
            
            if (mc.write_in && mc.write_in.includes(mc.options[option_idx])) {
              html += `<input type="text" name="${question_name}-writein" class="jspsych-survey-html-form-writein">`;
            }
            html += `</label>`;
          }
          html += `</div>`;

        } else if (question_format === "matrix") {
          const matrix = question.format;
          const matrix_labels = matrix.labels || [];
          const matrix_values = matrix.values || matrix.labels || [];
          html += `
            <div class="jspsych-survey-html-form-prompt">${question_prompt}</div>
            <div class="jspsych-survey-html-form-matrix-container">
              <div class="matrix-header-gap sticky-header"></div>
              <div class="matrix-header sticky-header">
                <div aria-label="Set of answer choices" class="matrix-scale-points-items" role="group">`;
                for (let label_idx = 0; label_idx < matrix_labels.length; label_idx++) {
                  html += `<div class="matrix-scale-points-item"><span class="display-with-image"><span class="display-with-image-display rich-text">${matrix_labels[label_idx]}</span></span></div>`;
                }
            html += `</div></div>`;
          for (let row_idx = 0; row_idx < matrix.options.length; row_idx++) {
            const row_group_name = `${question_name}_${matrix.names[row_idx]}`; 
            const row_id = `${question_id}-row-${row_idx}`;
            html += `
              <div class="jspsych-survey-html-form-matrix-row" id="${row_id}">
                <div class="jspsych-survey-html-form-matrix-row-label"><span>${matrix.options[row_idx]}</span></div>
                <div class="matrix-statement-items" role="radio-group">`;
            for (let value_idx = 0; value_idx < matrix_labels.length; value_idx++) {
              const option_id = `${question_id}-r${row_idx}-c${value_idx}`; 
              html += `
                <div class="grid-cell">
                  <label for="${option_id}" class="grid-cell-label">
                    <div class="grid-cell-input">
                      <span class="grid-cell-input-shadow"></span>
                      <input type="radio" name="${row_group_name}" id="${option_id}" value="${matrix_values[value_idx]}" ${question_requirements}>
                      <span class="radio-button"></span>
                    </div>
                  </label>
                </div>`;
            }
            html += `</div></div>`;
          }
          html += `</div>`;

        } else if (question_format === "number") {
          const number = question.format;
          html += `<label class="jspsych-survey-html-form-prompt" for="${question_id}-resp">${question_prompt}</label>
                   <input id="${question_id}-resp" class="jspsych-number-input" name="${question_name}" type="number" min="${number.number_min}" max="${number.number_max}" step="${number.number_step}" ${question_requirements}>`;
        } else if (question_format === "short_response") {
          const short = question.format;
          html += `<label class="jspsych-survey-html-form-prompt" for="${question_id}-resp">${question_prompt}</label>
                   <input id="${question_id}-resp" class="jspsych-text-input" name="${question_name}" type="text" ${short.short_text_max_length ? 'maxlength="'+short.short_text_max_length+'"' : ''} placeholder="${short.short_text_placeholder || ''}" ${question_requirements}>`;
        } else if (question_format === "essay") {
          const essay = question.format;
          html += `<label class="jspsych-survey-html-form-prompt" for="${question_id}-resp">${question_prompt}</label>
                   <textarea id="${question_id}-resp" class="jspsych-textarea-input" name="${question_name}" rows="${essay.essay_rows}" cols="${essay.essay_cols}" ${essay.essay_max_length ? 'maxlength="'+essay.essay_max_length+'"' : ''} placeholder="${essay.essay_placeholder || ''}" ${question_requirements}></textarea>`;
        }

        if (question.requirements?.explanation) {
          html += `<div class="feedback-container" style="display:none; margin-top:10px; padding:10px; background:#f8f9fa; border-left:4px solid #6c757d;">
                    <p style="margin:0; font-size:0.9em;"><strong>Explanation:</strong> ${question.requirements.explanation}</p>
                   </div>`;
        }
        html += "</fieldset>";
      }
    }

    html += `<div id="jspsych-survey-overlay"></div>
      <div id="jspsych-confirm-popup">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div class="warning-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <h2>Are you sure?</h2>
        </div>
        <p style="text-align: center;">There is at least one unanswered question.<br>Would you like to continue?</p>
        <button type="button" id="confirm-yes" class="jspsych-survey-html-form-next jspsych-btn" style="margin-right:10px;">Answer Question(s)</button>
        <button type="button" id="confirm-no" class="jspsych-btn">Continue Without Answering</button>
      </div>
      <div style="display: flex; justify-content: right; margin-top: 20px;">
        <button type="button" id="check-answers-btn" class="jspsych-btn">Check Answers</button>
        <button type="submit" id="next-btn" class="jspsych-survey-html-form-next jspsych-btn" disabled style="opacity: 0.5; cursor: not-allowed;">
          ${trial.button_label}<i class="fa-solid fa-arrow-right-to-bracket fa-sm bounce-right-hover" style="margin-left: 5px;"></i>
        </button>
      </div></form>`;

    display_element.innerHTML = html;

    if (!trial.custom_html) {
    // 1. Initial Visual Injection (Checkmarks)
    const svg_icon = `<span class="checkmark-svg"><svg height="1rem" viewBox="0 0 24 24" width="1rem" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="${checkPath}"></path></svg></span>`;
    display_element.querySelectorAll('.radio-button, .checkbox-button').forEach(btn => {
      btn.insertAdjacentHTML('beforeend', svg_icon);
    });

    // 2. Layout sizing
    const containers = display_element.querySelectorAll('.jspsych-survey-html-form-options-container-horizontal, .matrix-scale-points-items, .matrix-labels-items, .matrix-statement-items');
    containers.forEach((container) => {
      (container as HTMLElement).style.setProperty('--option-count', container.children.length.toString());
    });


    // Replace your current click listener with this one
    display_element.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // 1. Find the radio button within the clicked area
        const gridCell = target.closest('.grid-cell') as HTMLElement;
        const input = gridCell?.querySelector('input[type="radio"]') as HTMLInputElement;

        // 2. CRITICAL: Only show the border if the input is actually checked.
        // This prevents "near-miss" clicks from triggering the highlight.
        if (gridCell && input && input.checked) {
            const matrixContainer = gridCell.closest('.jspsych-survey-html-form-matrix-container') as HTMLElement;
            const rowItemsContainer = gridCell.closest('.matrix-statement-items');

            if (matrixContainer && rowItemsContainer) {
                const allCellsInRow = Array.from(rowItemsContainer.querySelectorAll('.grid-cell'));
                const colIndex = allCellsInRow.indexOf(gridCell);
                const headers = matrixContainer.querySelectorAll('.matrix-scale-points-item');
                
                headers.forEach(h => h.classList.remove('column-selected'));
                if (headers[colIndex]) {
                    headers[colIndex].classList.add('column-selected');
                }
            }
        } else {
            // Clear highlights if clicking row labels or outside actionable inputs
            display_element.querySelectorAll('.matrix-scale-points-item').forEach(h => {
                h.classList.remove('column-selected');
            });
        }
    });


    // Add this inside the !trial.custom_html section of your plugin
    display_element.addEventListener('click', (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const gridCell = target.closest('.grid-cell') as HTMLElement;
        const input = gridCell?.querySelector('input[type="radio"]') as HTMLInputElement;

        // requestAnimationFrame ensures we read the state AFTER the browser toggles the radio
        requestAnimationFrame(() => {
            if (gridCell && input && input.checked) {
                const matrixContainer = gridCell.closest('.jspsych-survey-html-form-matrix-container') as HTMLElement;
                const rowItemsContainer = gridCell.closest('.matrix-statement-items');

                if (matrixContainer && rowItemsContainer) {
                    const allCellsInRow = Array.from(rowItemsContainer.querySelectorAll('.grid-cell'));
                    const colIndex = allCellsInRow.indexOf(gridCell);
                    const headers = matrixContainer.querySelectorAll('.matrix-scale-points-item');
                    
                    // Clear and re-apply the blue border to the parent header div
                    headers.forEach(h => h.classList.remove('column-selected'));
                    if (headers[colIndex]) {
                        headers[colIndex].classList.add('column-selected');
                    }
                }
            } else if (!target.closest('.grid-cell-input')) {
                // Clear highlights if the user clicks away from the selection area
                display_element.querySelectorAll('.matrix-scale-points-item').forEach(h => {
                    h.classList.remove('column-selected');
                });
            }
        });
    });











      // 3. Universal Input Listener
      display_element.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        if (!target) return;
        const fieldset = target.closest('fieldset');
        if (!fieldset) return;

        const idParts = fieldset.id.split('-');
        const questionIdx = parseInt(idParts[idParts.length - 1]);
        
        // SAFE LOOKUP: Only proceed if the question index exists in this trial
        const question = questions[questionIdx];
        if (!question) return; 

        const question_format = question.format?.type || 'short_response';

        // Highlighting for Radio/Checkbox
        if (target.type === 'radio' || target.type === 'checkbox') {
          const matrixContainer = target.closest('.jspsych-survey-html-form-matrix-container') as HTMLElement;
          
          if (target.type === 'radio') {
            display_element.querySelectorAll(`input[name="${target.name}"]`).forEach(i => {
              const input = i as HTMLInputElement;
              input.closest('label')?.classList.remove('selected');
              input.closest('.grid-cell')?.classList.remove('selected');
            });
          }

          if (target.checked) {
            target.closest('label')?.classList.add('selected');
            target.closest('.grid-cell')?.classList.add('selected');
          }

          // Matrix Column Highlight Logic
          // if (question_format === "matrix" && matrixContainer) {
          
          // }

          // Validation completeness
          if (question_format === "matrix") {
            const allRows = fieldset.querySelectorAll('.jspsych-survey-html-form-matrix-row');
            const answeredRows = Array.from(allRows).filter(row => row.querySelector('input:checked'));
            answeredRows.length === allRows.length ? fieldset.classList.remove('incomplete') : fieldset.classList.add('incomplete');
          } else {
            fieldset.classList.remove('incomplete');
          }
        }

        // Text/Number inputs
        if (['number', 'text', 'textarea'].includes(target.type) || target.tagName === 'TEXTAREA') {
          if (!target.classList.contains('jspsych-survey-html-form-writein')) {
            target.value.trim() !== "" ? fieldset.classList.remove('incomplete') : fieldset.classList.add('incomplete');
          }
        }
      });

      // Slider/Write-in logic
      display_element.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('mousedown', () => {
          slider.closest('fieldset')?.classList.remove('incomplete');
          slider.setAttribute('data-touched', 'true');
        });
      });

      display_element.querySelectorAll<HTMLInputElement>('.jspsych-survey-html-form-writein').forEach(writein => {
        writein.addEventListener('input', () => {
          const associatedInput = writein.closest('label')?.querySelector('input') as HTMLInputElement;
          if (associatedInput && writein.value.trim() !== "") {
            associatedInput.checked = true;
            associatedInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      });
    }

    const form = display_element.querySelector(".jspsych-survey-html-form") as HTMLFormElement;
    let forceSubmit = false;
    const startTime = performance.now();

    // Buttons
    const checkBtn = display_element.querySelector("#check-answers-btn") as HTMLButtonElement;
    const nextBtn = display_element.querySelector("#next-btn") as HTMLButtonElement;
    if (!questions.some(q => q.requirements?.type === 'comprehension')) {
      checkBtn.style.display = "none";
      nextBtn.disabled = false;
      nextBtn.style.opacity = "1";
      nextBtn.style.cursor = "pointer";
    }

    checkBtn.addEventListener("click", () => {
      if (checkBtn.getAttribute("data-state") === "try-again") {
        questions.forEach((q, index) => {
          if (q.requirements?.type === 'comprehension') {
            const fs = display_element.querySelector(`#jspsych-survey-question-${index}`) as HTMLElement;
            fs.classList.remove("comprehension-check-success", "comprehension-check-fail");
            fs.classList.add("incomplete");
            const feedback = fs.querySelector(".feedback-container") as HTMLElement;
            if (feedback) feedback.style.display = "none";
          }
        });
        checkBtn.setAttribute("data-state", "check");
        checkBtn.innerHTML = 'Check Answers';
        return;
      }
      let allCorrect = true;
      const responses = objectifyForm(serializeArray(form));
      questions.forEach((q, index) => {
        if (q.requirements?.type === 'comprehension') {
          const fs = display_element.querySelector(`#jspsych-survey-question-${index}`) as HTMLElement;
          const userVal = responses[q.name || `jspsych-survey-question-${index}`];
          const isCorrect = String(userVal).trim().toLowerCase() === String(q.requirements.correct_answer).trim().toLowerCase();
          fs.classList.add(isCorrect ? "comprehension-check-success" : "comprehension-check-fail");
          if (!isCorrect) allCorrect = false;
          const feedback = fs.querySelector(".feedback-container") as HTMLElement;
          if (feedback) feedback.style.display = "block";
        }
      });
      if (allCorrect) {
        checkBtn.style.display = "none";
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
      } else {
        checkBtn.setAttribute("data-state", "try-again");
        checkBtn.innerHTML = 'Try Again <i class="fa-solid fa-rotate-right fa-sm" style="margin-left:5px;"></i>';
      }
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const requestIndices = questions.map((q, i) => q.requirements?.type === 'request' ? i : -1).filter(idx => idx !== -1);
      const incomplete = requestIndices.filter(idx => display_element.querySelector(`#jspsych-survey-question-${idx}`)?.classList.contains("incomplete"));

      if (incomplete.length > 0 && !forceSubmit) {
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

      display_element.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(s => {
        if (s.getAttribute('data-touched') !== 'true') s.removeAttribute('name');
      });

      this.jsPsych.finishTrial({ 
        rt: Math.round(performance.now() - startTime), 
        response: trial.dataAsArray ? serializeArray(form) : objectifyForm(serializeArray(form)) 
      });
    });

    function serializeArray(f: HTMLFormElement) {
      const data: any[] = [];
      for (let i = 0; i < f.elements.length; i++) {
        const field = f.elements[i] as any;
        if (!field.name || ['submit', 'button'].includes(field.type)) continue;
        if ((field.type !== "checkbox" && field.type !== "radio") || field.checked) {
          data.push({ name: field.name, value: field.value });
        }
      }
      return data;
    }

    function objectifyForm(arr: any[]) {
      const obj: any = {};
      arr.forEach(i => {
        if (i.name in obj) { obj[i.name] = Array.isArray(obj[i.name]) ? [...obj[i.name], i.value] : [obj[i.name], i.value]; } 
        else { obj[i.name] = i.value; }
      });
      return obj;
    }
  }
}

export default WyLabSurveyPlugin;