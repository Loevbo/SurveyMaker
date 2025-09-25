using SurveyMaker.Localization;
using Volo.Abp.AspNetCore.Mvc;

namespace SurveyMaker.Controllers;

/* Inherit your controllers from this class.
 */
public abstract class SurveyMakerController : AbpControllerBase
{
    protected SurveyMakerController()
    {
        LocalizationResource = typeof(SurveyMakerResource);
    }
}
