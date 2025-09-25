using Volo.Abp.Settings;

namespace SurveyMaker.Settings;

public class SurveyMakerSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(SurveyMakerSettings.MySetting1));
    }
}
