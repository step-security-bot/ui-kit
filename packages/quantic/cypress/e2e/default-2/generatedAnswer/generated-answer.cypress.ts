import {performSearch} from '../../../page-objects/actions/action-perform-search';
import {analyticsModeTest} from '../../../page-objects/analytics';
import {configure} from '../../../page-objects/configurator';
import {
  interceptSearch,
  mockSearchWithGeneratedAnswer,
  mockSearchWithoutGeneratedAnswer,
  mockStreamResponse,
  mockStreamError,
  InterceptAliases,
  getStreamInterceptAlias,
} from '../../../page-objects/search';
import {
  useCaseEnum,
  useCaseParamTest,
  InsightInterfaceExpectations as InsightInterfaceExpect,
} from '../../../page-objects/use-case';
import {scope} from '../../../reporters/detailed-collector';
import {setCookieToEnableNextAnalytics} from '../../../utils/analytics-utils';
import {NextAnalyticsExpectations} from '../../next-analytics-expectations';
import {GeneratedAnswerActions as Actions} from './generated-answer-actions';
import {GeneratedAnswerExpectations as Expect} from './generated-answer-expectations';

interface GeneratedAnswerOptions {
  answerStyle: string;
  multilineFooter: boolean;
  fieldsToIncludeInCitations: string;
  useCase: string;
}

let analyticsMode: 'legacy' | 'next' = 'legacy';
const exampleTrackingId = 'tracking_id_123';
const answerType = 'CRGA';

const GENERATED_ANSWER_DATA_KEY = 'coveo-generated-answer-data';
const otherOption = 'other';
const feedbackOptions = [
  'irrelevant',
  'notAccurate',
  'outOfDate',
  'harmful',
  otherOption,
];

const defaultFieldsToIncludeInCitations = 'sfid,sfkbid,sfkavid';
const defaultRephraseOption = 'default';
const stepRephraseOption = 'step';
const bulletRephraseOption = 'bullet';
const conciseRephraseOption = 'concise';

const rephraseOptions = [
  stepRephraseOption,
  bulletRephraseOption,
  conciseRephraseOption,
];

const testText = 'Some text';
const genQaMessageTypePayload = {
  payloadType: 'genqa.messageType',
  payload: JSON.stringify({
    textDelta: testText,
  }),
  finishReason: 'COMPLETED',
};

const retryableErrorCodes = [500, 429];

describe('quantic-generated-answer', () => {
  beforeEach(() => {
    cy.clock(0, ['Date']);
  });

  afterEach(() => {
    cy.clock().then((clock) => {
      clock.restore();
    });
  });

  const pageUrl = 's/quantic-generated-answer';

  function visitGeneratedAnswer(options: Partial<GeneratedAnswerOptions> = {}) {
    if (analyticsMode === 'next') {
      setCookieToEnableNextAnalytics(exampleTrackingId);
    }
    interceptSearch();
    cy.visit(pageUrl);
    configure(options);
    if (options.useCase === useCaseEnum.insight) {
      setupInsightUseCase();
    }
  }

  function setupInsightUseCase() {
    InsightInterfaceExpect.isInitialized();
    performSearch();
  }

  useCaseParamTest.forEach((param) => {
    describe(param.label, () => {
      describe('when no stream ID is returned', () => {
        beforeEach(() => {
          mockSearchWithoutGeneratedAnswer;
          visitGeneratedAnswer({useCase: param.useCase});
        });

        it('should not display the component', () => {
          Expect.displayGeneratedAnswerCard(false);
        });
      });

      describe('when stream ID is returned', () => {
        describe('when a message event is received', () => {
          const streamId = crypto.randomUUID();

          beforeEach(() => {
            mockSearchWithGeneratedAnswer(streamId, param.useCase);
            mockStreamResponse(streamId, genQaMessageTypePayload);
            visitGeneratedAnswer({useCase: param.useCase});
          });

          it('should log the stream ID in the search event custom data', () => {
            if (analyticsMode === 'legacy') {
              Expect.logStreamIdInAnalytics(streamId, param.useCase);
            }
          });

          it('should display the generated answer content', () => {
            Expect.displayGeneratedAnswerContent(true);
            Expect.sessionStorageContains(GENERATED_ANSWER_DATA_KEY, {});
            Expect.generatedAnswerFooterIsOnMultiline(false);
          });

          it('should display the correct message', () => {
            Expect.displayGeneratedAnswerCard(true);
            Expect.generatedAnswerContains(testText);
            Expect.generatedAnswerIsStreaming(false);
          });

          it('should perform a search query with the default rephrase button', () => {
            cy.wait(InterceptAliases.Search);
            Expect.searchQueryContainsCorrectRephraseOption(
              defaultRephraseOption
            );
          });

          it('should perform a search query with the default fields to include in citations', () => {
            cy.wait(InterceptAliases.Search);
            Expect.searchQueryContainsCorrectFieldsToIncludeInCitations(
              defaultFieldsToIncludeInCitations.split(',')
            );
          });

          it('should display rephrase buttons', () => {
            Expect.displayRephraseButtons(true);
            Expect.displayRephraseLabel(true);
          });

          it('should display feedback buttons', () => {
            Expect.displayLikeButton(true);
            Expect.displayDislikeButton(true);
            Expect.likeButtonIsChecked(false);
            Expect.dislikeButtonIsChecked(false);
          });
        });

        describe('when a value is provided to the answer style attribute', () => {
          const streamId = crypto.randomUUID();

          beforeEach(() => {
            mockSearchWithGeneratedAnswer(streamId, param.useCase);
            mockStreamResponse(streamId, genQaMessageTypePayload);
            visitGeneratedAnswer({
              answerStyle: bulletRephraseOption,
              useCase: param.useCase,
            });
          });

          it('should send a search query with the right rephrase option as a parameter', () => {
            scope('when loading the page', () => {
              Expect.displayRephraseButtons(true);
              Expect.rephraseButtonIsSelected(stepRephraseOption, false);
              Expect.rephraseButtonIsSelected(conciseRephraseOption, false);
              Expect.rephraseButtonIsSelected(bulletRephraseOption, true);
              Expect.searchQueryContainsCorrectRephraseOption(
                bulletRephraseOption
              );
            });
          });
        });

        describe('when a custom value is provided to the fields to include in citations attribute', () => {
          const streamId = crypto.randomUUID();
          const customFields = 'foo,bar';

          beforeEach(() => {
            mockSearchWithGeneratedAnswer(streamId, param.useCase);
            mockStreamResponse(streamId, genQaMessageTypePayload);
            visitGeneratedAnswer({
              fieldsToIncludeInCitations: customFields,
              useCase: param.useCase,
            });
          });

          it('should send a search query with the right fields to include in citations option as a parameter', () => {
            scope('when loading the page', () => {
              Expect.displayGeneratedAnswerContent(true);
              Expect.displayRephraseButtons(true);
              Expect.searchQueryContainsCorrectFieldsToIncludeInCitations(
                customFields.split(',')
              );
            });
          });
        });

        describe('when the property multilineFooter is set to true', () => {
          const streamId = crypto.randomUUID();

          beforeEach(() => {
            mockSearchWithGeneratedAnswer(streamId, param.useCase);
            mockStreamResponse(streamId, genQaMessageTypePayload);
            visitGeneratedAnswer({
              multilineFooter: true,
              useCase: param.useCase,
            });
          });

          it('should properly display the generated answer footer on multiple lines', () => {
            scope('when loading the page', () => {
              Expect.displayGeneratedAnswerCard(true);
              Expect.generatedAnswerFooterIsOnMultiline(true);
            });
          });
        });

        describe('when the generated answer is still streaming', () => {
          const streamId = crypto.randomUUID();

          const testMessagePayload = {
            payloadType: 'genqa.messageType',
            payload: JSON.stringify({
              textDelta: testText,
            }),
          };

          beforeEach(() => {
            mockSearchWithGeneratedAnswer(streamId, param.useCase);
            mockStreamResponse(streamId, testMessagePayload);
            visitGeneratedAnswer({useCase: param.useCase});
          });

          it('should display the correct message and the streaming cursor', () => {
            Expect.displayGeneratedAnswerCard(true);
            Expect.generatedAnswerContains(testText);
            Expect.generatedAnswerIsStreaming(true);
            Expect.displayRephraseButtons(false);
            Expect.displayLikeButton(false);
            Expect.displayDislikeButton(false);
            Expect.displayCopyToClipboardButton(false);
            Expect.displayToggleGeneratedAnswerButton(true);
            Expect.toggleGeneratedAnswerButtonIsChecked(true);
          });
        });

        rephraseOptions.forEach((option) => {
          const rephraseOption = option;

          describe(`when clicking the ${rephraseOption} rephrase button`, () => {
            const streamId = crypto.randomUUID();
            const secondStreamId = crypto.randomUUID();
            const thirdStreamId = crypto.randomUUID();

            beforeEach(() => {
              mockSearchWithGeneratedAnswer(streamId, param.useCase);
              mockStreamResponse(streamId, genQaMessageTypePayload);
              visitGeneratedAnswer({useCase: param.useCase});
            });

            it(`should send a new search query with the rephrase option ${option} as a parameter`, () => {
              scope('when loading the page', () => {
                Expect.displayRephraseButtonWithLabel(rephraseOption);
                Expect.rephraseButtonIsSelected(rephraseOption, false);
              });

              scope('when selecting the rephrase button', () => {
                mockSearchWithGeneratedAnswer(secondStreamId, param.useCase);
                mockStreamResponse(secondStreamId, genQaMessageTypePayload);

                Actions.clickRephraseButton(rephraseOption);
                Expect.displayRephraseButtonWithLabel(rephraseOption);
                Expect.rephraseButtonIsSelected(rephraseOption, true);
                rephraseOptions
                  .filter((item) => {
                    return item !== rephraseOption;
                  })
                  .forEach((unselectedOption) => {
                    Expect.displayRephraseButtonWithLabel(unselectedOption);
                    Expect.rephraseButtonIsSelected(unselectedOption, false);
                  });
                Expect.searchQueryContainsCorrectRephraseOption(rephraseOption);
                if (analyticsMode === 'legacy') {
                  Expect.logRephraseGeneratedAnswer(
                    rephraseOption,
                    secondStreamId
                  );
                }
              });

              scope('when unselecting the rephrase button', () => {
                mockSearchWithGeneratedAnswer(thirdStreamId, param.useCase);
                mockStreamResponse(thirdStreamId, genQaMessageTypePayload);

                Actions.clickRephraseButton(rephraseOption);
                rephraseOptions.forEach((unselectedOption) => {
                  Expect.displayRephraseButtonWithLabel(unselectedOption);
                  Expect.rephraseButtonIsSelected(unselectedOption, false);
                });
                Expect.searchQueryContainsCorrectRephraseOption(
                  defaultRephraseOption
                );
                if (analyticsMode === 'legacy') {
                  Expect.logRephraseGeneratedAnswer(
                    defaultRephraseOption,
                    thirdStreamId
                  );
                }
              });
            });
          });
        });

        describe('when an end of stream event is received', () => {
          const streamId = crypto.randomUUID();

          const testMessagePayload = {
            payloadType: 'genqa.endOfStreamType',
            payload: JSON.stringify({
              textDelta: testText,
            }),
            finishReason: 'COMPLETED',
          };

          beforeEach(() => {
            mockSearchWithGeneratedAnswer(streamId, param.useCase);
            mockStreamResponse(streamId, testMessagePayload);
            visitGeneratedAnswer({useCase: param.useCase});
          });

          it('should log the generated answer stream end event', () => {
            if (analyticsMode === 'legacy') {
              Expect.logGeneratedAnswerStreamEnd(streamId);
            }
          });
        });

        analyticsModeTest.forEach((analytics) => {
          describe(analytics.label, () => {
            before(() => {
              analyticsMode = analytics.mode;
            });

            describe('when liking the generated answer', () => {
              const streamId = crypto.randomUUID();

              beforeEach(() => {
                mockSearchWithGeneratedAnswer(streamId, param.useCase);
                mockStreamResponse(streamId, genQaMessageTypePayload);
                visitGeneratedAnswer({useCase: param.useCase});
              });

              it('should properly display the like button', () => {
                Expect.displayLikeButton(true);
                Expect.displayDislikeButton(true);
                Expect.likeButtonIsChecked(false);
                Expect.dislikeButtonIsChecked(false);

                scope('should properly log the analytics', () => {
                  Actions.likeGeneratedAnswer();
                  if (analyticsMode === 'next') {
                    NextAnalyticsExpectations.emitQnaLikeEvent(
                      {
                        feedback: {
                          liked: true,
                        },
                        answer: {
                          id: streamId,
                          type: answerType,
                        },
                      },
                      exampleTrackingId
                    );
                  } else {
                    Expect.logLikeGeneratedAnswer(streamId);
                  }
                  Expect.likeButtonIsChecked(true);
                  Expect.dislikeButtonIsChecked(false);
                });
              });
            });

            describe(
              'when providing detailed feedback',
              {
                retries: 20,
              },
              () => {
                const streamId = crypto.randomUUID();

                beforeEach(() => {
                  mockSearchWithGeneratedAnswer(streamId, param.useCase);
                  mockStreamResponse(streamId, genQaMessageTypePayload);
                  visitGeneratedAnswer({useCase: param.useCase});
                });

                it('should send detailed feedback', () => {
                  const exampleDetails = 'example details';

                  Expect.displayLikeButton(true);
                  Expect.displayDislikeButton(true);
                  Expect.likeButtonIsChecked(false);
                  Expect.dislikeButtonIsChecked(false);

                  scope('when disliking the generated answer', () => {
                    Actions.dislikeGeneratedAnswer();
                    if (analyticsMode === 'next') {
                      NextAnalyticsExpectations.emitQnaDislikeEvent(
                        {
                          feedback: {
                            liked: false,
                          },
                          answer: {
                            id: streamId,
                            type: answerType,
                          },
                        },
                        exampleTrackingId
                      );
                    } else {
                      Expect.logDislikeGeneratedAnswer(streamId);
                    }
                    Expect.likeButtonIsChecked(false);
                    Expect.dislikeButtonIsChecked(true);
                    Expect.displayFeedbackModal(true);
                  });

                  scope('when selecting a feedback option', () => {
                    Actions.clickFeedbackOption(
                      feedbackOptions.indexOf(otherOption)
                    );
                    Actions.typeInFeedbackDetailsInput(exampleDetails);
                    Actions.clickFeedbackSubmitButton();
                    if (analyticsMode === 'next') {
                      NextAnalyticsExpectations.emitQnaSubmitFeedbackReasonEvent(
                        {
                          feedback: {
                            liked: false,
                            details: exampleDetails,
                            reason: 'other',
                          },
                          answer: {
                            id: streamId,
                            type: answerType,
                          },
                        },
                        exampleTrackingId
                      );
                    } else {
                      Expect.logGeneratedAnswerFeedbackSubmit(streamId, {
                        reason: otherOption,
                        details: exampleDetails,
                      });
                    }
                    Actions.clickFeedbackDoneButton();
                  });

                  scope('when trying to open the feedback modal again', () => {
                    Actions.dislikeGeneratedAnswer();
                    Expect.displayFeedbackModal(false);
                  });

                  scope(
                    'when trying to open the feedback modal after rephrasing the generated answer',
                    () => {
                      const secondStreamId = crypto.randomUUID();

                      mockSearchWithGeneratedAnswer(
                        secondStreamId,
                        param.useCase
                      );
                      mockStreamResponse(
                        secondStreamId,
                        genQaMessageTypePayload
                      );
                      Actions.clickRephraseButton(rephraseOptions[0]);
                      Actions.dislikeGeneratedAnswer();
                      Expect.displayFeedbackModal(true);
                      Actions.clickFeedbackOption(
                        feedbackOptions.indexOf(otherOption)
                      );
                      Actions.typeInFeedbackDetailsInput(exampleDetails);
                      Actions.clickFeedbackSubmitButton();
                      if (analyticsMode === 'next') {
                        NextAnalyticsExpectations.emitQnaSubmitFeedbackReasonEvent(
                          {
                            feedback: {
                              liked: false,
                              details: exampleDetails,
                              reason: 'other',
                            },
                            answer: {
                              id: secondStreamId,
                              type: answerType,
                            },
                          },
                          exampleTrackingId
                        );
                      } else {
                        Expect.logGeneratedAnswerFeedbackSubmit(
                          secondStreamId,
                          {
                            reason: otherOption,
                            details: exampleDetails,
                          }
                        );
                      }

                      Actions.clickFeedbackDoneButton();
                    }
                  );

                  scope(
                    'when trying to open the feedback modal after executing a new query',
                    () => {
                      const thirdStreamId = crypto.randomUUID();

                      mockSearchWithGeneratedAnswer(
                        thirdStreamId,
                        param.useCase
                      );
                      mockStreamResponse(
                        thirdStreamId,
                        genQaMessageTypePayload
                      );
                      performSearch();
                      Actions.dislikeGeneratedAnswer();
                      Expect.displayFeedbackModal(true);
                      Actions.clickFeedbackOption(
                        feedbackOptions.indexOf(otherOption)
                      );
                      Actions.typeInFeedbackDetailsInput(exampleDetails);
                      Actions.clickFeedbackSubmitButton();
                      if (analyticsMode === 'next') {
                        NextAnalyticsExpectations.emitQnaSubmitFeedbackReasonEvent(
                          {
                            feedback: {
                              liked: false,
                              details: exampleDetails,
                              reason: 'other',
                            },
                            answer: {
                              id: thirdStreamId,
                              type: answerType,
                            },
                          },
                          exampleTrackingId
                        );
                      } else {
                        Expect.logGeneratedAnswerFeedbackSubmit(thirdStreamId, {
                          reason: otherOption,
                          details: exampleDetails,
                        });
                      }

                      Actions.clickFeedbackDoneButton();
                    }
                  );
                });
              }
            );

            describe('the generated answer toggle button', () => {
              const streamId = crypto.randomUUID();

              beforeEach(() => {
                mockSearchWithGeneratedAnswer(streamId, param.useCase);
                mockStreamResponse(streamId, genQaMessageTypePayload);
                visitGeneratedAnswer({useCase: param.useCase});
              });

              it('should display the toggle generated answer button', () => {
                Expect.displayToggleGeneratedAnswerButton(true);
                Expect.toggleGeneratedAnswerButtonIsChecked(true);

                scope('when toggling off the generated answer', () => {
                  Actions.clickToggleGeneratedAnswerButton();
                  Expect.toggleGeneratedAnswerButtonIsChecked(false);
                  Expect.displayGeneratedAnswerContent(false);
                  Expect.displayLikeButton(false);
                  Expect.displayDislikeButton(false);
                  if (analyticsMode === 'next') {
                    NextAnalyticsExpectations.emitQnaAnswerActionEvent(
                      {
                        answer: {
                          id: streamId,
                          type: answerType,
                        },
                        action: 'hide',
                      },
                      exampleTrackingId
                    );
                  } else {
                    Expect.logHideGeneratedAnswer(streamId);
                  }
                  Expect.sessionStorageContains(GENERATED_ANSWER_DATA_KEY, {
                    isVisible: false,
                  });
                });

                scope('when toggling on the generated answer', () => {
                  Actions.clickToggleGeneratedAnswerButton();
                  Expect.toggleGeneratedAnswerButtonIsChecked(true);
                  Expect.displayGeneratedAnswerContent(true);
                  Expect.displayLikeButton(true);
                  Expect.displayDislikeButton(true);
                  if (analyticsMode === 'next') {
                    NextAnalyticsExpectations.emitQnaAnswerActionEvent(
                      {
                        answer: {
                          id: streamId,
                          type: answerType,
                        },
                        action: 'show',
                      },
                      exampleTrackingId
                    );
                  } else {
                    Expect.logShowGeneratedAnswer(streamId);
                  }
                  Expect.sessionStorageContains(GENERATED_ANSWER_DATA_KEY, {
                    isVisible: true,
                  });
                });
              });
            });

            // access to the clipboard reliably works in Electron browser
            // in other browsers, there are popups asking for permission
            // thus we should only run these tests in Electron
            describe(
              'when clicking the copy to clipboard button',
              {browser: 'electron'},
              () => {
                const streamId = crypto.randomUUID();

                beforeEach(() => {
                  mockSearchWithGeneratedAnswer(streamId, param.useCase);
                  mockStreamResponse(streamId, genQaMessageTypePayload);
                  visitGeneratedAnswer({
                    multilineFooter: true,
                    useCase: param.useCase,
                  });
                });

                it('should properly copy the answer to clipboard', () => {
                  scope('when loading the page', () => {
                    Expect.displayCopyToClipboardButton(true);
                    Actions.clickCopyToClipboardButton();
                    if (analyticsMode === 'next') {
                      NextAnalyticsExpectations.emitQnaAnswerActionEvent(
                        {
                          answer: {
                            id: streamId,
                            type: answerType,
                          },
                          action: 'copyToClipboard',
                        },
                        exampleTrackingId
                      );
                    } else {
                      Expect.logCopyGeneratedAnswer(streamId);
                    }
                    cy.window().then((win) => {
                      win.navigator.clipboard.readText().then((text) => {
                        expect(text).to.eq(testText);
                      });
                    });
                  });
                });
              }
            );

            describe('when a citation event is received', () => {
              const exampleLinkUrl = '#';
              const streamId = crypto.randomUUID();
              const firstTestCitation = {
                id: 'some-id-1',
                title: 'Some Title 1',
                uri: 'https://www.coveo.com',
                permanentid: 'some-permanent-id-1',
                clickUri: exampleLinkUrl,
                text: 'example text 1',
              };
              const secondTestCitation = {
                id: 'some-id-2',
                title: 'Some Title 2',
                uri: 'https://www.coveo.com',
                permanentid: 'some-permanent-id-2',
                clickUri: exampleLinkUrl,
                text: 'example text 2',
              };
              const testCitations = [firstTestCitation, secondTestCitation];
              const testMessagePayload = {
                payloadType: 'genqa.citationsType',
                payload: JSON.stringify({
                  citations: testCitations,
                }),
                finishReason: 'COMPLETED',
              };

              beforeEach(() => {
                mockSearchWithGeneratedAnswer(streamId, param.useCase);
                mockStreamResponse(streamId, testMessagePayload);
                visitGeneratedAnswer({useCase: param.useCase});
              });

              it('should properly display the source citations', () => {
                Expect.displayCitations(true);
                testCitations.forEach((citation, index) => {
                  Expect.citationTitleContains(index, citation.title);
                  Expect.citationNumberContains(index, `${index + 1}`);
                  Expect.citationLinkContains(index, citation.clickUri);
                });
              });

              describe('hovering over a generated answer citation', () => {
                const hoveredCitationIndex = 0;

                it('should properly display the tooltip', () => {
                  Expect.displayCitations(true);
                  testCitations.forEach((citation, index) => {
                    Expect.citationTooltipIsDisplayed(index, false);
                    Actions.hoverOverCitation(index);
                    Expect.citationTooltipIsDisplayed(index, true);
                    Expect.citationTooltipUrlContains(index, citation.clickUri);
                    Expect.citationTooltipTitleContains(index, citation.title);
                    Expect.citationTooltipTextContains(index, citation.text);
                  });
                });

                it('should log the analytics only after hovering more than 1000ms', () => {
                  Expect.citationTooltipIsDisplayed(
                    hoveredCitationIndex,
                    false
                  );

                  Actions.hoverOverCitation(0);
                  Expect.citationTooltipIsDisplayed(hoveredCitationIndex, true);
                  cy.tick(1000);
                  Actions.stopHoverOverCitation(0);
                  if (analyticsMode === 'next') {
                    NextAnalyticsExpectations.emitQnaCitationHover(
                      {
                        answer: {
                          id: streamId,
                          type: answerType,
                        },
                        citation: {
                          id: testCitations[hoveredCitationIndex].id,
                        },
                      },
                      exampleTrackingId
                    );
                  } else {
                    Expect.logHoverGeneratedAnswerSource(
                      streamId,
                      testCitations[hoveredCitationIndex]
                    );
                  }

                  Expect.citationTooltipIsDisplayed(
                    hoveredCitationIndex,
                    false
                  );
                });
              });

              it('should log the correct analytics event when a citation is clicked', () => {
                const clickedCitationIndex = 0;

                Expect.displayCitations(true);

                Actions.clickCitation(0);
                if (analyticsMode === 'next') {
                  NextAnalyticsExpectations.emitQnaCitationClick(
                    {
                      answer: {
                        id: streamId,
                        type: answerType,
                      },
                      citation: {
                        id: testCitations[clickedCitationIndex].id,
                      },
                    },
                    exampleTrackingId
                  );
                } else {
                  Expect.logOpenGeneratedAnswerSource(
                    streamId,
                    testCitations[clickedCitationIndex]
                  );
                }
              });
            });
          });
        });

        describe('when an error event is received', () => {
          const streamId = crypto.randomUUID();

          const testErrorPayload = {
            finishReason: 'ERROR',
            errorMessage: 'An error message',
            errorCode: 500,
          };

          beforeEach(() => {
            mockSearchWithGeneratedAnswer(streamId, param.useCase);
            mockStreamResponse(streamId, testErrorPayload);
            visitGeneratedAnswer({useCase: param.useCase});
          });

          it('should not display the component', () => {
            Expect.displayGeneratedAnswerCard(false);
          });
        });

        describe('when the stream connection fails', () => {
          const streamId = crypto.randomUUID();

          describe('Non-retryable error (4XX)', () => {
            beforeEach(() => {
              mockSearchWithGeneratedAnswer(streamId, param.useCase);
              mockStreamError(streamId, 406);
              visitGeneratedAnswer({useCase: param.useCase});
              cy.wait(getStreamInterceptAlias(streamId));
            });

            it('should not show the component', () => {
              Expect.displayGeneratedAnswerCard(false);
            });
          });

          describe('Retryable error', () => {
            retryableErrorCodes.forEach((errorCode) => {
              describe(`${errorCode} error`, () => {
                beforeEach(() => {
                  mockSearchWithGeneratedAnswer(streamId, param.useCase);
                  mockStreamError(streamId, errorCode);
                  visitGeneratedAnswer({useCase: param.useCase});
                });

                it('should retry the stream 3 times then offer a retry button', () => {
                  for (let times = 0; times < 3; times++) {
                    Expect.displayGeneratedAnswerCard(false);
                    cy.wait(getStreamInterceptAlias(streamId));
                  }
                  Expect.displayGeneratedAnswerCard(true);

                  Actions.clickRetry();
                  cy.wait(InterceptAliases.Search);
                  if (analyticsMode === 'legacy') {
                    Expect.logRetryGeneratedAnswer(streamId);
                  }
                });
              });
            });
          });
        });
      });
    });
  });
});
